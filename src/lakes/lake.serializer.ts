import { Lake } from '@prisma/client';

export interface FishSpeciesDto {
  name_ka: string;
  name_en?: string;
  // How rare / hard to catch: 1 = common/easy … 5 = rare/hard.
  catch_difficulty: number;
  // Optional admin-uploaded photo of the species (absolute /uploads/ URL).
  image_uri?: string;
}

// Matches the app's `Lake` type (types/fishing.ts).
export interface LakeDto {
  id: number;
  name_ka: string;
  name_en: string;
  region: string;
  type: 'lake' | 'reservoir' | 'river';
  coordinates: { latitude: number; longitude: number };
  area_km2?: number;
  max_depth_meters?: number;
  description?: string;
  fish_species: FishSpeciesDto[];
}

export function toLakeDto(lake: Lake): LakeDto {
  return {
    id: lake.id,
    name_ka: lake.nameKa,
    name_en: lake.nameEn,
    region: lake.region,
    type: lake.type as LakeDto['type'],
    coordinates: { latitude: lake.latitude, longitude: lake.longitude },
    ...(lake.areaKm2 != null ? { area_km2: lake.areaKm2 } : {}),
    ...(lake.maxDepthMeters != null ? { max_depth_meters: lake.maxDepthMeters } : {}),
    ...(lake.description ? { description: lake.description } : {}),
    fish_species: (lake.fishSpecies as unknown as FishSpeciesDto[]) ?? [],
  };
}
