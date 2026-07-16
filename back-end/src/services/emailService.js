import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function hasEmailConfig() {
  return Boolean(env.email.smtpHost && env.email.smtpUser && env.email.smtpPass && env.email.fromAddress);
}

function createTransporter() {
  if (!hasEmailConfig()) {
    throw new Error('SMTP nao configurado. Preencha SMTP_HOST, SMTP_USER, SMTP_PASS e EMAIL_FROM_ADDRESS.');
  }

  return nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure,
    auth: {
      user: env.email.smtpUser,
      pass: env.email.smtpPass,
    },
  });
}

export async function sendEmail({ to, subject, text, html }) {
  const transporter = createTransporter();
  const from = `${env.email.fromName} <${env.email.fromAddress}>`;

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: 'Teste de e-mail - Torinno FC',
    text: [
      'Teste de e-mail do Torinno FC.',
      '',
      'Se voce recebeu esta mensagem, o SMTP/Gmail do backend esta configurado corretamente.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; background:#05070a; color:#f8fafc; padding:24px;">
        <div style="max-width:520px; margin:auto; border:1px solid rgba(212,162,76,.3); border-radius:14px; padding:20px;">
          <h1 style="color:#d4a24c; margin:0 0 12px;">Torinno FC</h1>
          <p style="margin:0 0 10px;">Teste de e-mail enviado pelo backend.</p>
          <p style="margin:0; color:#99a4b8;">Se voce recebeu esta mensagem, o SMTP/Gmail esta funcionando.</p>
        </div>
      </div>
    `,
  });
}
