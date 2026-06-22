import { IsOptional, IsString, MaxLength } from 'class-validator';

// The app only changes the avatar from the client; total_catches is managed
// server-side by creating/deleting catches, so it is intentionally not editable here.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  avatar?: string;
}
