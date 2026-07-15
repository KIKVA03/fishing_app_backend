-- CreateTable
CREATE TABLE "spots" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "spots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spots_user_id_idx" ON "spots"("user_id");

-- CreateIndex
CREATE INDEX "spots_is_public_idx" ON "spots"("is_public");

-- AddForeignKey
ALTER TABLE "spots" ADD CONSTRAINT "spots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backend connects as table owner (bypasses RLS); deny-all for public API keys.
ALTER TABLE "spots" ENABLE ROW LEVEL SECURITY;
