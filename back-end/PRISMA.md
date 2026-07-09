# Prisma

O backend usa Prisma para acessar o Postgres do Supabase e facilitar migrations.

## Variavel de ambiente

Configure apenas no backend:

```env
DATABASE_URL=postgresql://postgres:[senha]@[host]:5432/postgres?schema=public
```

Nao coloque essa URL no frontend. Ela deve ficar somente em `back-end/.env`.

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
