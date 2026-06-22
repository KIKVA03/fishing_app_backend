import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LakeDto, toLakeDto } from './lake.serializer';

@Injectable()
export class LakesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<LakeDto[]> {
    const lakes = await this.prisma.lake.findMany({ orderBy: { id: 'asc' } });
    return lakes.map(toLakeDto);
  }

  async findOne(id: number): Promise<LakeDto> {
    const lake = await this.prisma.lake.findUnique({ where: { id } });
    if (!lake) {
      throw new NotFoundException('ტბა ვერ მოიძებნა');
    }
    return toLakeDto(lake);
  }
}
