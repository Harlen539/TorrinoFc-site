import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminApiKey: process.env.ADMIN_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  whatsapp: {
    notificationMode: process.env.WHATSAPP_NOTIFICATION_MODE || 'manual',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    groupId: process.env.WHATSAPP_GROUP_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
    adminRecipients: (process.env.WHATSAPP_ADMIN_RECIPIENTS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  },
};

export function assertBackendConfig() {
  const missing = [];

  if (!env.databaseUrl) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    throw new Error(`Variaveis de ambiente obrigatorias ausentes: ${missing.join(', ')}`);
  }
}
