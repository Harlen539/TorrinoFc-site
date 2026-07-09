import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { assertBackendConfig } from '../config/env.js';
import { env } from '../config/env.js';

assertBackendConfig();

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
});

export const prisma = new PrismaClient({ adapter });
