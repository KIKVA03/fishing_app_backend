import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Spot, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpotDto, UpdateSpotDto } from './dto/spot.dto';

// Spam guard: how many pins one user may keep.
const MAX_SPOTS_PER_USER = 20;

const SPOT_INCLUDE = {
  user: { select: { username: true, avatar: true } },
} as const;

type SpotWithUser = Spot & { user: { username: string; avatar: string } };

export interface SpotDto {
  id: string;
  title: string;
  note?: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  username: string;
  avatar: string;
  createdAt: number;
}

function toSpotDto(spot: SpotWithUser): SpotDto {
  return {
    id: spot.id,
    title: spot.title,
    ...(spot.note ? { note: spot.note } : {}),
    latitude: spot.latitude,
    longitude: spot.longitude,
    isPublic: spot.isPublic,
    username: spot.user.username,
    avatar: spot.user.avatar,
    createdAt: spot.createdAt.getTime(),
  };
}

@Injectable()
export class SpotsService {
  constructor(private readonly prisma: PrismaService) {}

  // Everyone's published pins (shown to all users, even guests).
  async findPublic(): Promise<SpotDto[]> {
    const spots = await this.prisma.spot.findMany({
      where: { isPublic: true },
      include: SPOT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return spots.map(toSpotDto);
  }

  // The signed-in user's own pins (private + published).
  async findMine(userId: string): Promise<SpotDto[]> {
    const spots = await this.prisma.spot.findMany({
      where: { userId },
      include: SPOT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return spots.map(toSpotDto);
  }

  async create(userId: string, dto: CreateSpotDto): Promise<SpotDto> {
    const count = await this.prisma.spot.count({ where: { userId } });
    if (count >= MAX_SPOTS_PER_USER) {
      throw new BadRequestException(
        `მაქსიმუმ ${MAX_SPOTS_PER_USER} პინის დამატება შეიძლება — წაშალე ძველი, რომ ახალი დაამატო`,
      );
    }
    const spot = await this.prisma.spot.create({
      data: {
        userId,
        title: dto.title.trim(),
        note: dto.note?.trim() || null,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: SPOT_INCLUDE,
    });
    return toSpotDto(spot);
  }

  async update(user: User, spotId: string, dto: UpdateSpotDto): Promise<SpotDto> {
    await this.assertOwner(user, spotId);
    const spot = await this.prisma.spot.update({
      where: { id: spotId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      },
      include: SPOT_INCLUDE,
    });
    return toSpotDto(spot);
  }

  async remove(user: User, spotId: string): Promise<{ success: true }> {
    await this.assertOwner(user, spotId);
    await this.prisma.spot.delete({ where: { id: spotId } });
    return { success: true };
  }

  // Admin moderation: list everything / delete anyone's pin.
  async adminList() {
    const spots = await this.prisma.spot.findMany({
      include: SPOT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return spots.map(toSpotDto);
  }

  async adminRemove(spotId: string): Promise<{ success: true }> {
    const spot = await this.prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) throw new NotFoundException('პინი ვერ მოიძებნა');
    await this.prisma.spot.delete({ where: { id: spotId } });
    return { success: true };
  }

  private async assertOwner(user: User, spotId: string): Promise<void> {
    const spot = await this.prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) throw new NotFoundException('პინი ვერ მოიძებნა');
    if (spot.userId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('მხოლოდ ავტორს შეუძლია პინის შეცვლა');
    }
  }
}
