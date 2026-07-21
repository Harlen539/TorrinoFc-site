CREATE TABLE IF NOT EXISTS "achievements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "icon" text NOT NULL DEFAULT 'star',
  "category" text NOT NULL DEFAULT 'performance',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "player_achievements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id" uuid NOT NULL,
  "achievement_id" uuid NOT NULL,
  "unlocked_at" timestamptz NOT NULL DEFAULT now(),
  "metadata" jsonb,
  CONSTRAINT "player_achievements_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "player_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "player_achievements_achievement_id_fkey"
    FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "player_achievements_player_achievement_key"
  ON "player_achievements"("player_id", "achievement_id");

CREATE INDEX IF NOT EXISTS "player_achievements_achievement_id_idx"
  ON "player_achievements"("achievement_id");

CREATE TABLE IF NOT EXISTS "match_attendances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "match_id" uuid NOT NULL,
  "player_id" uuid NOT NULL,
  "status" text NOT NULL,
  "notes" text,
  "responded_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "match_attendances_match_id_fkey"
    FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "match_attendances_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "player_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "match_attendances_status_check"
    CHECK ("status" IN ('confirmed', 'maybe', 'unavailable'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "match_attendances_match_player_key"
  ON "match_attendances"("match_id", "player_id");

CREATE INDEX IF NOT EXISTS "match_attendances_player_status_idx"
  ON "match_attendances"("player_id", "status");

CREATE TABLE IF NOT EXISTS "match_lineups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "match_id" uuid NOT NULL UNIQUE,
  "formation" text NOT NULL DEFAULT '4-3-3',
  "captain_id" uuid,
  "created_by" uuid,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "match_lineups_match_id_fkey"
    FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "match_lineup_players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lineup_id" uuid NOT NULL,
  "player_id" uuid NOT NULL,
  "role" text NOT NULL,
  "position" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  CONSTRAINT "match_lineup_players_lineup_id_fkey"
    FOREIGN KEY ("lineup_id") REFERENCES "match_lineups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "match_lineup_players_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "player_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "match_lineup_players_role_check"
    CHECK ("role" IN ('starter', 'bench'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "match_lineup_players_lineup_player_key"
  ON "match_lineup_players"("lineup_id", "player_id");

CREATE INDEX IF NOT EXISTS "match_lineup_players_player_id_idx"
  ON "match_lineup_players"("player_id");

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL,
  "actor_id" uuid,
  "actor_name" text,
  "message" text NOT NULL,
  "related_entity_type" text,
  "related_entity_id" uuid,
  "action_url" text,
  "metadata" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx"
  ON "activity_logs"("created_at");

CREATE INDEX IF NOT EXISTS "activity_logs_related_idx"
  ON "activity_logs"("related_entity_type", "related_entity_id");

INSERT INTO "achievements" ("key", "name", "description", "icon", "category")
VALUES
  ('first_goal', 'Primeiro gol', 'Marcou o primeiro gol pelo Torinno FC.', 'target', 'performance'),
  ('first_assist', 'Primeira assistencia', 'Deu a primeira assistencia pelo Torinno FC.', 'sparkles', 'performance'),
  ('ten_matches', '10 partidas', 'Registrou desempenho em 10 partidas.', 'flag', 'milestone'),
  ('twenty_five_matches', '25 partidas', 'Registrou desempenho em 25 partidas.', 'crown', 'milestone'),
  ('hat_trick', 'Hat-trick', 'Marcou tres ou mais gols em uma partida.', 'trophy', 'performance'),
  ('high_rating', 'Nota acima de 9', 'Recebeu nota maior ou igual a 9 em uma partida.', 'star', 'performance'),
  ('five_wins', '5 vitorias', 'Acumulou 5 vitorias registradas.', 'shield', 'milestone'),
  ('defensive_wall', 'Muralha defensiva', 'Somou 25 roubadas, desarmes e interceptacoes.', 'shield', 'performance'),
  ('founder', 'Fundador', 'Perfil marcado como fundador do clube.', 'crown', 'role'),
  ('captain', 'Capitao', 'Foi escolhido como capitao em uma escalacao.', 'badge', 'role')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "player_achievements" ("player_id", "achievement_id", "metadata")
SELECT pp."id", a."id", jsonb_build_object('source', 'backfill')
FROM "player_profiles" pp
JOIN "profiles" p ON p."id" = pp."user_id"
JOIN "achievements" a ON a."key" = 'founder'
WHERE p."staff_role" = 'Fundador'
ON CONFLICT ("player_id", "achievement_id") DO NOTHING;
