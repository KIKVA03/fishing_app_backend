-- CreateTable
CREATE TABLE "fish_info" (
    "name" TEXT NOT NULL,
    "tip" TEXT,
    "baits" JSONB NOT NULL,

    CONSTRAINT "fish_info_pkey" PRIMARY KEY ("name")
);

-- Backend connects as table owner (bypasses RLS); deny-all for public API keys.
ALTER TABLE "fish_info" ENABLE ROW LEVEL SECURITY;
