import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigins: [
    ...(process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter((origin, index, items) => items.indexOf(origin) === index),
  adminApiKey: process.env.ADMIN_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
    secretKey: process.env.SUPABASE_SECRET_KEY || '',
    jwksUrl: process.env.SUPABASE_JWKS_URL || '',
  },
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
  notifications: {
    reminderSchedulerEnabled: process.env.ENABLE_REMINDER_SCHEDULER === 'true',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'Torinno FC',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || '',
  },
};

export function assertBackendConfig() {
  const missing = [];

  if (!env.databaseUrl) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    throw new Error(`Variaveis de ambiente obrigatorias ausentes: ${missing.join(', ')}`);
  }
}
