import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { join } from 'path';
import { UPLOADS_DIR } from '../catches/upload.config';
import { LakeDto, toLakeDto } from '../lakes/lake.serializer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLakeDto, UpdateLakeDto } from './dto/lake.dto';

const DAY_MS = 86400000;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Absolute URL for a file multer just wrote into UPLOADS_DIR (same scheme as catches).
  buildUploadUrl(filename: string): string {
    const base = (this.config.get<string>('PUBLIC_URL') ?? 'http://localhost:4000').replace(
      /\/+$/,
      '',
    );
    return `${base}/uploads/${filename}`;
  }

  // ── Dashboard ────────────────────────────────────────────────
  async stats() {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS);
    const [users, catches, comments, lakes, usersWeek, catchesWeek, recentUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.catch.count(),
        this.prisma.comment.count(),
        this.prisma.lake.count(),
        this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.catch.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, username: true, avatar: true, createdAt: true },
        }),
      ]);
    return { users, catches, comments, lakes, usersWeek, catchesWeek, recentUsers };
  }

  // ── Users ────────────────────────────────────────────────────
  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { catches: true, comments: true } } },
    });
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      isAdmin: u.isAdmin,
      totalCatches: u.totalCatches,
      photoCount: u._count.catches,
      commentCount: u._count.comments,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  // Deletes the user + all their rows (cascade) and their photo files on disk.
  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new ConflictException('საკუთარი ანგარიშის წაშლა აქედან არ შეიძლება');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { catches: { select: { imageUri: true } } },
    });
    if (!user) throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');

    await this.prisma.user.delete({ where: { id: userId } });
    for (const c of user.catches) this.removeFile(c.imageUri);
    return { success: true };
  }

  // ── Catches (photo moderation) ───────────────────────────────
  async listCatches(limit = 200) {
    const catches = await this.prisma.catch.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        lake: { select: { nameKa: true } },
        user: { select: { username: true } },
      },
    });
    return catches.map((c) => ({
      id: c.id,
      imageUri: c.imageUri,
      lakeName: c.lake.nameKa,
      username: c.user.username,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async deleteCatch(catchId: string) {
    const entry = await this.prisma.catch.findUnique({ where: { id: catchId } });
    if (!entry) throw new NotFoundException('ფოტო ვერ მოიძებნა');
    await this.prisma.catch.delete({ where: { id: catchId } });
    this.removeFile(entry.imageUri);
    return { success: true };
  }

  // ── Comments moderation ──────────────────────────────────────
  async listComments(limit = 300) {
    const comments = await this.prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        lake: { select: { nameKa: true } },
        user: { select: { username: true } },
      },
    });
    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      lakeName: c.lake.nameKa,
      username: c.user.username,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async deleteComment(commentId: string) {
    const entry = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!entry) throw new NotFoundException('კომენტარი ვერ მოიძებნა');
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  // ── Lakes CRUD ───────────────────────────────────────────────
  async createLake(dto: CreateLakeDto): Promise<LakeDto> {
    const existing = await this.prisma.lake.findUnique({ where: { id: dto.id } });
    if (existing) throw new ConflictException(`ტბა id=${dto.id} უკვე არსებობს`);
    const lake = await this.prisma.lake.create({ data: this.toLakeData(dto) });
    return toLakeDto(lake);
  }

  async updateLake(id: number, dto: UpdateLakeDto): Promise<LakeDto> {
    const existing = await this.prisma.lake.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('ტბა ვერ მოიძებნა');
    const lake = await this.prisma.lake.update({
      where: { id },
      data: {
        ...(dto.name_ka !== undefined ? { nameKa: dto.name_ka } : {}),
        ...(dto.name_en !== undefined ? { nameEn: dto.name_en } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.region !== undefined ? { region: dto.region } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.area_km2 !== undefined ? { areaKm2: dto.area_km2 } : {}),
        ...(dto.max_depth_meters !== undefined
          ? { maxDepthMeters: dto.max_depth_meters }
          : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.fish_species !== undefined
          ? { fishSpecies: dto.fish_species as unknown as object[] }
          : {}),
      },
    });
    return toLakeDto(lake);
  }

  // Deleting a lake cascades its catches/comments; clean up photo files too.
  async deleteLake(id: number) {
    const lake = await this.prisma.lake.findUnique({
      where: { id },
      include: { catches: { select: { imageUri: true } } },
    });
    if (!lake) throw new NotFoundException('ტბა ვერ მოიძებნა');
    await this.prisma.lake.delete({ where: { id } });
    for (const c of lake.catches) this.removeFile(c.imageUri);
    return { success: true };
  }

  private toLakeData(dto: CreateLakeDto) {
    return {
      id: dto.id,
      nameKa: dto.name_ka,
      nameEn: dto.name_en,
      type: dto.type,
      region: dto.region,
      latitude: dto.latitude,
      longitude: dto.longitude,
      areaKm2: dto.area_km2 ?? null,
      maxDepthMeters: dto.max_depth_meters ?? null,
      description: dto.description ?? null,
      fishSpecies: dto.fish_species as unknown as object[],
    };
  }

  private removeFile(imageUri: string): void {
    const filename = imageUri.split('/uploads/')[1] ?? '';
    if (!filename) return;
    fs.promises.unlink(join(UPLOADS_DIR, filename)).catch(() => undefined);
  }
}
