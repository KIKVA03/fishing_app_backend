import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BaitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  // Optional photo uploaded via POST /api/admin/fish-image.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_uri?: string;
}

export class UpsertFishInfoDto {
  // Georgian species name this entry applies to (matches fish_species.name_ka).
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  tip?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaitDto)
  baits: BaitDto[];
}
