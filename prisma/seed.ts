import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Shape of the entries inside lakesData.json (mirrors the app's `Lake` type).
interface SeedLake {
  id: number;
  name_ka: string;
  name_en: string;
  type: string;
  region: string;
  coordinates: { latitude: number; longitude: number };
  area_km2?: number;
  max_depth_meters?: number;
  description?: string;
  fish_species: unknown[];
}

async function main() {
  const dataPath = path.join(__dirname, 'lakesData.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const lakes = JSON.parse(raw) as SeedLake[];

  console.log(`Seeding ${lakes.length} lakes...`);

  for (const lake of lakes) {
    await prisma.lake.upsert({
      where: { id: lake.id },
      update: {
        nameKa: lake.name_ka,
        nameEn: lake.name_en,
        type: lake.type,
        region: lake.region,
        latitude: lake.coordinates.latitude,
        longitude: lake.coordinates.longitude,
        areaKm2: lake.area_km2 ?? null,
        maxDepthMeters: lake.max_depth_meters ?? null,
        description: lake.description ?? null,
        fishSpecies: lake.fish_species as object[],
      },
      create: {
        id: lake.id,
        nameKa: lake.name_ka,
        nameEn: lake.name_en,
        type: lake.type,
        region: lake.region,
        latitude: lake.coordinates.latitude,
        longitude: lake.coordinates.longitude,
        areaKm2: lake.area_km2 ?? null,
        maxDepthMeters: lake.max_depth_meters ?? null,
        description: lake.description ?? null,
        fishSpecies: lake.fish_species as object[],
      },
    });
  }

  console.log('✅ Lakes seeded.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
