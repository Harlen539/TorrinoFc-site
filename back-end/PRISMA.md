# Prisma

O backend usa Prisma para acessar o Postgres do Supabase e facilitar migrations.

## Variavel de ambiente

Configure apenas no backend:

```env
DATABASE_URL=postgresql://postgres.<project-ref>:[senha]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<project-ref>:[senha]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

Nao coloque essas URLs no frontend. Elas devem ficar somente em `back-end/.env` e nas variaveis de ambiente do backend no Render.

No Supabase Pooler, o usuario precisa ter o formato `postgres.<project-ref>`. Se usar apenas `postgres` em `aws-*.pooler.supabase.com`, o deploy falha com `P1000: Authentication failed`.

Use:

- `DATABASE_URL`: Transaction pooler, porta `6543`, para a API em runtime.
- `DIRECT_URL`: Session pooler, porta `5432`, para `prisma migrate deploy`.

Se a senha tiver caracteres especiais como `#`, `@`, `%`, `/` ou `?`, copie a string pronta pelo painel do Supabase ou codifique a senha para URL.

## Comandos

```bash
cd back-end
npm install
npm run db:generate
```

Criar uma migration nova:

```bash
npm run db:migrate -- --name nome_da_migration
```

Aplicar migrations em producao:

```bash
npm run db:deploy
```

Abrir Prisma Studio:

```bash
npm run db:studio
```

## Observacao sobre o Supabase

A migration inicial antiga continua em `supabase/migrations/001_initial_torinno_schema.sql`.
As novas migrations ficam em `prisma/migrations`.

Se o banco ja existir antes de adotar Prisma, faca o baseline da migration inicial antes de usar `migrate dev` em um ambiente compartilhado.
