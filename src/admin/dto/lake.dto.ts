import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class FishSpeciesInputDto {
  @IsString()
  @MaxLength(80)
  name_ka: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name_en?: string;

  // How rare / hard to catch: 1 = common/easy … 5 = rare/hard.
  @IsInt()
  @Min(1)
  @Max(5)
  catch_difficulty: number;

  // Optional photo of the species, uploaded via POST /api/admin/fish-image.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_uri?: string;
}

export class CreateLakeDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @MaxLength(120)
  name_ka: string;

  @IsString()
  @MaxLength(120)
  name_en: string;

  @IsIn(['lake', 'reservoir', 'river'])
  type: string;

  @IsString()
  @MaxLength(80)
  region: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  area_km2?: number;

  @IsOptional()
  @IsNumber()
  max_depth_meters?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FishSpeciesInputDto)
  fish_species: FishSpeciesInputDto[];
}

export class UpdateLakeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name_ka?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name_en?: string;

  @IsOptional()
  @IsIn(['lake', 'reservoir', 'river'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  area_km2?: number;

  @IsOptional()
  @IsNumber()
  max_depth_meters?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FishSpeciesInputDto)
  fish_species?: FishSpeciesInputDto[];
}
