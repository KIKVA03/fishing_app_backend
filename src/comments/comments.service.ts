import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentDto, toCommentDto } from './comment.serializer';
import { CreateCommentDto } from './dto/create-comment.dto';

const COMMENT_INCLUDE = {
  user: { select: { username: true, avatar: true } },
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByLake(lakeId: number): Promise<CommentDto[]> {
    const comments = await this.prisma.comment.findMany({
      where: { lakeId },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return comments.map(toCommentDto);
  }

  async create(userId: string, dto: CreateCommentDto): Promise<CommentDto> {
    const lake = await this.prisma.lake.findUnique({ where: { id: dto.lakeId } });
    if (!lake) {
      throw new NotFoundException('ტბა ვერ მოიძებნა');
    }

    const created = await this.prisma.comment.create({
      data: { userId, lakeId: dto.lakeId, text: dto.text.trim() },
      include: COMMENT_INCLUDE,
    });
    return toCommentDto(created);
  }

  async remove(userId: string, commentId: string): Promise<{ success: true }> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('კომენტარი ვერ მოიძებნა');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('მხოლოდ ავტორს შეუძლია კომენტარის წაშლა');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
