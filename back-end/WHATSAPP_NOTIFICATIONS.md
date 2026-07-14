# WhatsApp Notifications

Esta integracao pode funcionar em modo manual ou com a WhatsApp Business Platform / Cloud API no backend.
Nao use WhatsApp Web, QR Code, scraping ou bibliotecas nao oficiais.

## Configuracao

Crie `back-end/.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Variaveis principais:

```env
DATABASE_URL=postgresql://postgres:[senha]@[host]:5432/postgres?schema=public
WHATSAPP_NOTIFICATION_MODE=manual
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GROUP_ID=
WHATSAPP_API_VERSION=v22.0
```

Com `WHATSAPP_NOTIFICATION_MODE=manual`, nenhuma chave externa da Meta/Facebook Developers e necessaria. O backend registra a notificacao como `manual_required`, e o frontend usa o fallback que abre o grupo e copia a mensagem para colar manualmente.

O link `chat.whatsapp.com` nao envia mensagem automaticamente. Ele serve apenas como referencia para abrir o grupo. Para envio automatico real, configure `WHATSAPP_NOTIFICATION_MODE=cloud_api` e o Group ID liberado pela Meta para a conta WhatsApp Business.

Se a conta nao tiver acesso a Groups API, use a alternativa oficial:

```env
WHATSAPP_NOTIFICATION_MODE=cloud_api
WHATSAPP_ADMIN_RECIPIENTS=5585999999999,5585888888888
```

Nesse modo, a mensagem e enviada para numeros privados autorizados em vez de grupo.

## Endpoints Internos

Todos os endpoints exigem o header `x-admin-api-key` com o valor de `ADMIN_API_KEY`.

### Criar Partida

```http
POST /api/admin/matches
Content-Type: application/json
x-admin-api-key: sua-chave-interna
```

```json
{
  "home_team": "Torrino FC",
  "away_team": "Vikings FC",
  "match_date": "2026-07-15",
  "match_time": "20:30",
  "location": "EA FC 26 | Clubs",
  "observations": "Entrar 10 minutos antes."
}
```

Fluxo:

1. Valida dados.
2. Salva em `matches`.
3. Chama `sendMatchNotification(match.id)`.
4. Registra o envio em `notification_logs`.

### Criar Peneira

```http
POST /api/admin/tryouts
Content-Type: application/json
x-admin-api-key: sua-chave-interna
```

```json
{
  "title": "Peneira semanal",
  "tryout_date": "2026-07-16",
  "tryout_time": "19:00",
  "location": "EA FC 26 | Clubs",
  "category": "Geral",
  "requirements": "OVR 85+, headset e disponibilidade noturna.",
  "observations": "Teste em lobby privado."
}
```

Fluxo:

1. Valida dados.
2. Salva em `tryouts`.
3. Chama `sendTryoutNotification(tryout.id)`.
4. Registra o envio em `notification_logs`.

## Tabela `notification_logs`

O modelo Prisma `NotificationLog` representa a tabela `notification_logs`:

- `event_type`
- `entity_id`
- `channel`
- `destination`
- `status`
- `message_body`
- `api_response`
- `error_message`
- `sent_at`
- `created_at`
- `updated_at`

A constraint unica em `(event_type, entity_id, channel, destination)` impede envio duplicado para o mesmo agendamento e destino.

Para criar novas migrations:

```bash
cd back-end
npm run db:migrate -- --name nome_da_migration
```

Veja tambem `PRISMA.md` para o fluxo completo de migrations.

## Servico

Arquivo principal:

```text
src/services/whatsappNotificationService.js
```

Funcoes exportadas:

- `sendWhatsAppGroupMessage(message)`
- `sendMatchNotification(matchId)`
- `sendTryoutNotification(tryoutId)`

Erros da API sao gravados em `notification_logs` com status `failed`, e o endpoint principal continua respondendo com o agendamento criado.
