# TorrinoFC Site

Plataforma oficial do TorinnoFC organizada em duas areas:

- `front-end/`: aplicacao React + Vite.
- `back-end/`: API Node/Express, Prisma e migrations de banco.

## Frontend

```bash
cd front-end
npm install
npm run dev
```

## Build

```bash
cd front-end
npm run build
```

## Backend

O backend usa Prisma para acessar o Postgres do Supabase e facilitar migrations.

O backend tambem possui uma API Node/Express para criar partidas e peneiras. Por padrao, o WhatsApp fica em modo manual, sem chave externa da Meta/Facebook Developers.

```bash
cd back-end
npm install
cp .env.example .env
npm run dev
```

Configure no `back-end/.env`:

- `DATABASE_URL`
- `ADMIN_API_KEY`
- `WHATSAPP_NOTIFICATION_MODE=manual`
- `WHATSAPP_API_VERSION`

Com `WHATSAPP_NOTIFICATION_MODE=manual`, o app abre o grupo do WhatsApp e copia a mensagem para colar manualmente. O link `chat.whatsapp.com` nao envia mensagem automaticamente.

Para envio automatico oficial, troque para `WHATSAPP_NOTIFICATION_MODE=cloud_api` e configure `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_GROUP_ID` da Meta. Caso a conta nao tenha Groups API, configure `WHATSAPP_ADMIN_RECIPIENTS` para enviar a mensagem aos administradores autorizados.

Detalhes e exemplos de payload estao em `back-end/WHATSAPP_NOTIFICATIONS.md`.

## Prisma

O backend usa Prisma para acessar o Postgres e facilitar migrations:

```bash
cd back-end
npm run db:generate
npm run db:migrate -- --name nome_da_migration
```

Em producao, aplique migrations com:

```bash
npm run db:deploy
```

Detalhes do fluxo Prisma estao em `back-end/PRISMA.md`.
