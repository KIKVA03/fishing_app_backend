import { User } from '@prisma/client';

// Matches the app's `AuthUser` type (types/fishing.ts).
export interface AuthUserDto {
  id: string;
  username: string;
  email: string;
  avatar: string;
  total_catches: number;
  createdAt: string;
}

export function toAuthUser(user: User): AuthUserDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    total_catches: user.totalCatches,
    createdAt: user.createdAt.toISOString(),
  };
}
