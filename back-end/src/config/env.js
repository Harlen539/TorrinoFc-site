import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminApiKey: process.env.ADMIN_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  whatsapp: {
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

  if (!env.supabaseUrl) missing.push('SUPABASE_URL');
  if (!env.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    throw new Error(`Variaveis de ambiente obrigatorias ausentes: ${missing.join(', ')}`);
  }
}
