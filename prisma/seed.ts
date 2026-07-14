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

  // Baseline bait knowledge per fish (edited later from the admin panel).
  // upsert-create only: never overwrite admin edits on re-seed.
  const fishInfoPath = path.join(__dirname, 'fishInfoData.json');
  const fishInfo = JSON.parse(fs.readFileSync(fishInfoPath, 'utf-8')) as {
    name: string;
    tip?: string;
    baits: object[];
  }[];
  let created = 0;
  for (const info of fishInfo) {
    const existing = await prisma.fishInfo.findUnique({ where: { name: info.name } });
    if (existing) continue;
    await prisma.fishInfo.create({
      data: { name: info.name, tip: info.tip ?? null, baits: info.baits },
    });
    created += 1;
  }
  console.log(`✅ Fish info seeded (${created} new, ${fishInfo.length - created} kept).`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
