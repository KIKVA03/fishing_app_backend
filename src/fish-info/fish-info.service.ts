import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertFishInfoDto } from './dto/fish-info.dto';

export interface FishInfoDto {
  name: string;
  tip?: string;
  baits: { name: string; image_uri?: string }[];
}

@Injectable()
export class FishInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<FishInfoDto[]> {
    const rows = await this.prisma.fishInfo.findMany({ orderBy: { name: 'asc' } });
    return rows.map((row) => ({
      name: row.name,
      ...(row.tip ? { tip: row.tip } : {}),
      baits: (row.baits as FishInfoDto['baits']) ?? [],
    }));
  }

  // Creates or fully replaces the entry for a fish (admin panel "save").
  async upsert(dto: UpsertFishInfoDto): Promise<FishInfoDto> {
    const name = dto.name.trim();
    const data = {
      tip: dto.tip?.trim() || null,
      baits: dto.baits as unknown as object[],
    };
    const row = await this.prisma.fishInfo.upsert({
      where: { name },
      create: { name, ...data },
      update: data,
    });
    return {
      name: row.name,
      ...(row.tip ? { tip: row.tip } : {}),
      baits: (row.baits as FishInfoDto['baits']) ?? [],
    };
  }

  async remove(name: string): Promise<{ success: true }> {
    const existing = await this.prisma.fishInfo.findUnique({ where: { name } });
    if (!existing) {
      throw new NotFoundException('ამ თევზის ჩანაწერი ვერ მოიძებნა');
    }
    await this.prisma.fishInfo.delete({ where: { name } });
    return { success: true };
  }
}
