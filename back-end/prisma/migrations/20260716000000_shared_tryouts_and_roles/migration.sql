ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'player';

UPDATE "profiles"
SET "role" = 'player'
WHERE "role" IS NULL OR "role" NOT IN ('admin', 'player');

ALTER TABLE "tryouts"
  ADD COLUMN IF NOT EXISTS "team_name" TEXT NOT NULL DEFAULT 'Torinno FC',
  ADD COLUMN IF NOT EXISTS "overall" INTEGER,
  ADD COLUMN IF NOT EXISTS "contact" TEXT;

CREATE INDEX IF NOT EXISTS "tryouts_team_status_idx"
  ON "tryouts"("team_name", "status");
