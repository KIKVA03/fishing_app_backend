import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  accountAgeDays,
  calculateUserScore,
  getRankTier,
} from '../common/scoring';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUserDto, toAuthUser } from './user.serializer';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  total_catches: number;
  score: number;
  tier: { emoji: string; name: string; color: string };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: string, dto: UpdateUserDto): Promise<AuthUserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}) },
    });
    return toAuthUser(user);
  }

  async leaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      include: { _count: { select: { catches: true } } },
    });

    const ranked = users
      .map((user) => {
        const photoCount = user._count.catches;
        // Photos are gallery-only now — they don't add points or count as catches.
        const score = calculateUserScore(
          user.totalCatches,
          accountAgeDays(user.createdAt),
          photoCount,
        );
        const tier = getRankTier(score);
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          total_catches: user.totalCatches,
          score,
          tier: { emoji: tier.emoji, name: tier.name, color: tier.color },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    return ranked;
  }
}
