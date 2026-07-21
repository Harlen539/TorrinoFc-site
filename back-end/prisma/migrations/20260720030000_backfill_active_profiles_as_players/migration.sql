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
WHERE p."account_status" <> 'removed'
  AND NOT EXISTS (
    SELECT 1 FROM "player_profiles" pp WHERE pp."user_id" = p."id"
  );

INSERT INTO "player_stats" ("player_id")
SELECT pp."id"
FROM "player_profiles" pp
WHERE NOT EXISTS (
  SELECT 1 FROM "player_stats" ps WHERE ps."player_id" = pp."id"
);
