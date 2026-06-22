import { Catch, Lake, User } from '@prisma/client';

export type CatchWithRelations = Catch & {
  lake: Pick<Lake, 'nameKa'>;
  user: Pick<User, 'username' | 'avatar'>;
};

// Matches the app's `CatchPhoto` type (types/fishing.ts).
export interface CatchPhotoDto {
  id: string;
  lakeId: number;
  lakeName: string;
  username: string;
  avatar: string;
  imageUri: string;
  timestamp: number;
}

export function toCatchPhoto(entry: CatchWithRelations): CatchPhotoDto {
  return {
    id: entry.id,
    lakeId: entry.lakeId,
    lakeName: entry.lake.nameKa,
    username: entry.user.username,
    avatar: entry.user.avatar,
    imageUri: entry.imageUri,
    timestamp: entry.createdAt.getTime(),
  };
}
