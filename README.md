# TorrinoFC Site

Plataforma oficial do TorinnoFC organizada em duas areas:

- `front-end/`: aplicacao React + Vite.
- `back-end/`: arquivos de backend, incluindo migrations do Supabase.

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

As migrations do Supabase ficam em `back-end/supabase/migrations`.

O backend tambem possui uma API Node/Express para criar partidas e peneiras com notificacao oficial via WhatsApp Business Platform / Cloud API.

```bash
cd back-end
npm install
cp .env.example .env
npm run dev
```

Configure no `back-end/.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GROUP_ID`
- `WHATSAPP_API_VERSION`

O link `chat.whatsapp.com` serve apenas como referencia. O envio automatico usa o `WHATSAPP_GROUP_ID` oficial liberado pela Meta. Caso a conta nao tenha Groups API, configure `WHATSAPP_ADMIN_RECIPIENTS` para enviar a mensagem aos administradores autorizados.

Detalhes e exemplos de payload estao em `back-end/WHATSAPP_NOTIFICATIONS.md`.
