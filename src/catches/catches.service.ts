import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CatchPhotoDto, toCatchPhoto } from './catch.serializer';
import { UPLOADS_DIR } from './upload.config';

// Always pull the relation fields the serializer needs.
const CATCH_INCLUDE = {
  lake: { select: { nameKa: true } },
  user: { select: { username: true, avatar: true } },
} as const;

// Max photos a single user may upload per calendar day (server time).
const DAILY_PHOTO_LIMIT = 3;

@Injectable()
export class CatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findByLake(lakeId: number): Promise<CatchPhotoDto[]> {
    const catches = await this.prisma.catch.findMany({
      where: { lakeId },
      include: CATCH_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return catches.map(toCatchPhoto);
  }

  async findByUser(userId: string): Promise<CatchPhotoDto[]> {
    const catches = await this.prisma.catch.findMany({
      where: { userId },
      include: CATCH_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return catches.map(toCatchPhoto);
  }

  async create(
    userId: string,
    lakeId: number,
    file: Express.Multer.File,
  ): Promise<CatchPhotoDto> {
    if (!file) {
      throw new BadRequestException('ფოტო აუცილებელია');
    }

    const lake = await this.prisma.lake.findUnique({ where: { id: lakeId } });
    if (!lake) {
      this.removeFile(file.filename);
      throw new NotFoundException('ტბა ვერ მოიძებნა');
    }

    // Enforce the per-day upload cap (counts this user's photos since midnight).
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.catch.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });
    if (todayCount >= DAILY_PHOTO_LIMIT) {
      this.removeFile(file.filename);
      throw new BadRequestException(
        `დღეში მაქსიმუმ ${DAILY_PHOTO_LIMIT} ფოტოს ატვირთვა შეიძლება. სცადე ხვალ 🎣`,
      );
    }

    const imageUri = this.buildImageUrl(file.filename);

    // Photos are gallery-only now — they don't award points, so we no longer
    // bump the user's total_catches here. (Re-add a user.update increment to
    // make photos count again.)
    const created = await this.prisma.catch.create({
      data: { userId, lakeId, imageUri },
      include: CATCH_INCLUDE,
    });

    return toCatchPhoto(created);
  }

  async remove(userId: string, catchId: string): Promise<{ success: true }> {
    const entry = await this.prisma.catch.findUnique({ where: { id: catchId } });
    if (!entry) {
      throw new NotFoundException('ფოტო ვერ მოიძებნა');
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException('მხოლოდ ავტორს შეუძლია ფოტოს წაშლა');
    }

    // Photos no longer count toward total_catches, so deleting one just removes
    // the row (no user.update decrement needed anymore).
    await this.prisma.catch.delete({ where: { id: catchId } });

    // Best-effort cleanup of the stored file.
    this.removeFile(this.filenameFromUrl(entry.imageUri));

    return { success: true };
  }

  private buildImageUrl(filename: string): string {
    const base = (this.config.get<string>('PUBLIC_URL') ?? 'http://localhost:4000').replace(
      /\/+$/,
      '',
    );
    return `${base}/uploads/${filename}`;
  }

  private filenameFromUrl(url: string): string {
    return url.split('/uploads/')[1] ?? '';
  }

  private removeFile(filename: string): void {
    if (!filename) return;
    const filePath = join(UPLOADS_DIR, filename);
    fs.promises.unlink(filePath).catch(() => undefined);
  }
}
