import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const fallbackDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public';

export function getMigrationDatabaseUrl() {
  const source = process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL';
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || fallbackDatabaseUrl;

  validateSupabaseUrl(databaseUrl, source);

  return databaseUrl;
}

export function validateSupabaseUrl(databaseUrl, source) {
  let parsedUrl;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error(`${source} nao e uma URL Postgres valida.`);
  }

  const isSupabasePooler = parsedUrl.hostname.endsWith('.pooler.supabase.com');

  if (!isSupabasePooler) return;

  if (parsedUrl.username === 'postgres') {
    throw new Error(
      `${source} esta usando o Supabase Pooler com usuario "postgres". ` +
        'No pooler, use "postgres.<project-ref>", por exemplo: ' +
        'postgresql://postgres.cvhggeakriafznoevjsd:[SENHA]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
    );
  }

  if (!process.env.DIRECT_URL && parsedUrl.port === '6543') {
    throw new Error(
      'Prisma migrations precisam de DIRECT_URL. Configure DIRECT_URL com a Session pooler ' +
        '(porta 5432) ou a Direct connection do Supabase. Deixe DATABASE_URL na porta 6543 para runtime.',
    );
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
