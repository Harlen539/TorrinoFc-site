# WhatsApp Notifications

Esta integracao usa somente a WhatsApp Business Platform / Cloud API no backend.
Nao use WhatsApp Web, QR Code, scraping ou bibliotecas nao oficiais.

## Configuracao

Crie `back-end/.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Variaveis principais:

```env
WHATSAPP_ACCESS_TOKEN=seu-token-da-cloud-api
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_GROUP_ID=seu-group-id-oficial
WHATSAPP_API_VERSION=v22.0
```

O link `chat.whatsapp.com` nao envia mensagem automaticamente. Ele serve apenas como referencia para identificar o grupo. Para envio real, configure o Group ID liberado pela Meta para a conta WhatsApp Business.

Se a conta nao tiver acesso a Groups API, use a alternativa oficial:

```env
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

A migration `supabase/migrations/002_whatsapp_notification_logs.sql` cria:

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
