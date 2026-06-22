import { Comment, User } from '@prisma/client';

export type CommentWithUser = Comment & {
  user: Pick<User, 'username' | 'avatar'>;
};

// Matches the app's `LakeComment` type (types/fishing.ts).
export interface CommentDto {
  id: string;
  lakeId: number;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export function toCommentDto(entry: CommentWithUser): CommentDto {
  return {
    id: entry.id,
    lakeId: entry.lakeId,
    userId: entry.userId,
    username: entry.user.username,
    avatar: entry.user.avatar,
    text: entry.text,
    timestamp: entry.createdAt.getTime(),
  };
}
