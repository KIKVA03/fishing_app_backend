-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '🎣',
    "total_catches" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lakes" (
    "id" INTEGER NOT NULL,
    "name_ka" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "area_km2" DOUBLE PRECISION,
    "max_depth_meters" DOUBLE PRECISION,
    "description" TEXT,
    "fish_species" JSONB NOT NULL,

    CONSTRAINT "lakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catches" (
    "id" TEXT NOT NULL,
    "image_uri" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lake_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "catches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "catches_lake_id_idx" ON "catches"("lake_id");

-- CreateIndex
CREATE INDEX "catches_user_id_idx" ON "catches"("user_id");

-- AddForeignKey
ALTER TABLE "catches" ADD CONSTRAINT "catches_lake_id_fkey" FOREIGN KEY ("lake_id") REFERENCES "lakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catches" ADD CONSTRAINT "catches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
