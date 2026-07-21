-- Link users to one player profile, add match performance history, and persist settings.

WITH duplicated_links AS (
  SELECT
    "id",
    row_number() OVER (PARTITION BY "user_id" ORDER BY "created_at" ASC, "id" ASC) AS link_order
  FROM "player_profiles"
  WHERE "user_id" IS NOT NULL
)
UPDATE "player_profiles" pp
SET "user_id" = NULL,
    "updated_at" = now()
FROM duplicated_links dl
WHERE pp."id" = dl."id"
  AND dl.link_order > 1;

UPDATE "player_profiles" pp
SET "user_id" = NULL,
    "updated_at" = now()
WHERE pp."user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "profiles" p WHERE p."id" = pp."user_id"
  );

ALTER TABLE "player_profiles"
  ADD CONSTRAINT "player_profiles_user_id_key" UNIQUE ("user_id");

CREATE INDEX IF NOT EXISTS "player_profiles_user_id_idx"
  ON "player_profiles"("user_id");

ALTER TABLE "player_profiles"
  ADD CONSTRAINT "player_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "player_stats"
  ADD COLUMN IF NOT EXISTS "tackles" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "interceptions" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "player_match_performances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id" uuid NOT NULL,
  "match_id" uuid NOT NULL,
  "goals" integer NOT NULL DEFAULT 0,
  "assists" integer NOT NULL DEFAULT 0,
  "ball_recoveries" integer NOT NULL DEFAULT 0,
  "shots" integer NOT NULL DEFAULT 0,
  "accurate_passes" integer NOT NULL DEFAULT 0,
  "tackles" integer NOT NULL DEFAULT 0,
  "interceptions" integer NOT NULL DEFAULT 0,
  "yellow_cards" integer NOT NULL DEFAULT 0,
  "red_cards" integer NOT NULL DEFAULT 0,
  "minutes_played" integer NOT NULL DEFAULT 0,
  "rating" numeric(3,1) NOT NULL DEFAULT 0,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "player_match_performances_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "player_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "player_match_performances_match_id_fkey"
    FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "player_match_performances_non_negative_check"
    CHECK (
      goals >= 0 AND assists >= 0 AND ball_recoveries >= 0 AND shots >= 0
      AND accurate_passes >= 0 AND tackles >= 0 AND interceptions >= 0
      AND yellow_cards >= 0 AND red_cards >= 0 AND minutes_played >= 0
      AND rating >= 0 AND rating <= 10
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS "player_match_performances_player_match_key"
  ON "player_match_performances"("player_id", "match_id");

CREATE INDEX IF NOT EXISTS "player_match_performances_match_id_idx"
  ON "player_match_performances"("match_id");

CREATE INDEX IF NOT EXISTS "player_match_performances_created_by_idx"
  ON "player_match_performances"("created_by");

CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "club_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  "value" jsonb NOT NULL,
  "updated_by" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role" text NOT NULL,
  "permission_key" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT false,
  "updated_by" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "role_permissions_role_key" UNIQUE ("role", "permission_key")
);

CREATE INDEX IF NOT EXISTS "role_permissions_role_idx"
  ON "role_permissions"("role");

INSERT INTO "player_profiles" (
  "user_id",
  "team_name",
  "full_name",
  "nickname",
  "position",
  "shirt_number",
  "status",
  "avatar_url",
  "created_at",
  "updated_at"
)
SELECT
  p."id",
  'Torinno FC',
  p."name",
  COALESCE(NULLIF(p."nickname", ''), p."name"),
  'Sem posicao',
  0,
  'Ativo',
  p."avatar_url",
  now(),
  now()
FROM "profiles" p
WHERE p."role" = 'player'
  AND NOT EXISTS (
    SELECT 1 FROM "player_profiles" pp WHERE pp."user_id" = p."id"
  );

INSERT INTO "player_stats" ("player_id")
SELECT pp."id"
FROM "player_profiles" pp
WHERE NOT EXISTS (
  SELECT 1 FROM "player_stats" ps WHERE ps."player_id" = pp."id"
);

INSERT INTO "club_settings" ("key", "value")
VALUES
  ('rules', '{"matches":true,"calendar":true,"registration":true,"performanceApproval":false,"showFutureMatches":true,"showLogos":true,"editAfterCreation":true}'::jsonb),
  ('notifications', '{"matchAlerts":true,"newMatch":true,"newTryout":true,"matchUpdated":true,"matchReminder24h":true,"matchReminder1h":true,"championships":true,"newMembers":true,"statistics":true,"administration":true}'::jsonb),
  ('matches', '{"adminsCreateMatches":true,"playersSeeFutureMatches":true,"showOpponentLogo":true,"showFinishedMatches":true,"allowEditAfterCreate":true}'::jsonb),
  ('players', '{"adminsCreatePlayers":true,"playersEditOwnProfile":true,"playersEditOwnStats":true,"requirePerformanceApproval":false,"showShirtOnProfile":true,"showPositionOnProfile":true}'::jsonb)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("role", "permission_key", "enabled")
VALUES
  ('admin', 'create_match', true),
  ('admin', 'createMatch', true),
  ('admin', 'edit_match', true),
  ('admin', 'editMatch', true),
  ('admin', 'delete_match', true),
  ('admin', 'deleteMatch', true),
  ('admin', 'create_player', true),
  ('admin', 'createPlayer', true),
  ('admin', 'edit_player', true),
  ('admin', 'editPlayer', true),
  ('admin', 'remove_player', true),
  ('admin', 'removePlayer', true),
  ('admin', 'manage_calendar', true),
  ('admin', 'manageCalendar', true),
  ('admin', 'manage_club_profile', true),
  ('admin', 'manageClubProfile', true),
  ('admin', 'send_notifications', true),
  ('admin', 'sendNotifications', true),
  ('admin', 'manage_permissions', true),
  ('admin', 'managePermissions', true),
  ('admin', 'manage_tryouts', true),
  ('admin', 'manageTryouts', true),
  ('admin', 'manage_championships', true),
  ('admin', 'manageChampionships', true),
  ('admin', 'edit_any_performance', true),
  ('admin', 'editAnyPerformance', true),
  ('player', 'view_calendar', true),
  ('player', 'viewCalendar', true),
  ('player', 'view_matches', true),
  ('player', 'viewMatches', true),
  ('player', 'edit_own_performance', true),
  ('player', 'editOwnPerformance', true),
  ('player', 'edit_own_profile', true),
  ('player', 'editOwnProfile', true)
ON CONFLICT ("role", "permission_key") DO NOTHING;
