<div align="center">
  <img src="./front-end/public/assets/logo-torrino.png" alt="Logo do Torinno FC" width="150" />

  # Torinno FC

  **Plataforma completa para gestão de elenco, partidas e desempenho do Torinno FC no EA FC Clubs.**

  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
</div>

## Sobre o projeto

O **Torinno FC** centraliza a organização do clube em um único sistema. A plataforma reúne elenco, agenda, campeonatos, estatísticas, notificações e ferramentas administrativas, sempre utilizando os dados reais cadastrados pelos jogadores e administradores.

O repositório é dividido em duas aplicações:

- `front-end/`: interface web construída com React e Vite.
- `back-end/`: API REST em Node.js e Express, integrada ao Supabase/PostgreSQL por meio do Prisma.

## Funcionalidades

- Autenticação de usuários com Supabase.
- Controle de acesso por perfis de jogador e administrador.
- Painel com métricas e atividades reais do clube.
- Cadastro e gerenciamento de jogadores, posições e números de camisa.
- Perfis individuais com gols, assistências, roubadas de bola e avaliações.
- Ranking e comparação de desempenho entre jogadores.
- Agenda de partidas, peneiras e campeonatos.
- Calendário interativo com eventos do clube.
- Matchday com confirmação de presença, escalação, capitão, reservas e placar.
- Notificações de eventos e lembretes de partidas.
- Relatórios de desempenho em PDF e CSV.
- Configurações persistentes do clube e dos usuários.
- Integração manual ou oficial com WhatsApp Cloud API.
- Envio de e-mails por SMTP.
- Área administrativa para gerenciar usuários, funções, elenco e dados do time.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 6, ApexCharts, Lucide React |
| Backend | Node.js, Express, Helmet, Nodemailer, PDFKit |
| Banco de dados | PostgreSQL, Supabase, Prisma ORM |
| Autenticação | Supabase Auth com autorização por função |
| Qualidade | Oxlint e scripts de verificação do Node.js |
| Deploy | Frontend estático e backend compatível com Render |

## Estrutura do repositório

```text
TorrinoFc-site/
├── front-end/             # Aplicação React + Vite
│   ├── public/            # Imagens e arquivos públicos
│   └── src/               # Componentes, estilos e integrações
├── back-end/              # API Node.js + Express
│   ├── prisma/            # Schema e migrations do Prisma
│   ├── src/
│   │   ├── routes/        # Rotas da API
│   │   ├── services/      # Regras de negócio e integrações
│   │   ├── middleware/    # Autenticação e autorização
│   │   └── lib/           # Prisma, validações e utilitários
│   ├── PRISMA.md
│   └── WHATSAPP_NOTIFICATIONS.md
└── README.md
```

## Pré-requisitos

Antes de começar, tenha instalado:

- [Node.js](https://nodejs.org/) — versão 20 LTS ou superior recomendada.
- npm.
- Um projeto no [Supabase](https://supabase.com/) com PostgreSQL e Auth configurados.

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Harlen539/TorrinoFc-site.git
cd TorrinoFc-site
```

### 2. Configure o frontend

```bash
cd front-end
npm install
cp .env.example .env
```

Preencha o arquivo `front-end/.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_ADMIN_API_URL=http://localhost:4000
```

> Nunca coloque a chave secreta do Supabase ou credenciais administrativas em variáveis `VITE_*`, pois elas ficam acessíveis no navegador.

Inicie a interface:

```bash
npm run dev
```

O frontend estará disponível, por padrão, em `http://localhost:5173`.

### 3. Configure o backend

Em outro terminal:

```bash
cd back-end
npm install
cp .env.example .env
```

Configure no arquivo `back-end/.env`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SECRET_KEY=sua-chave-secreta
SUPABASE_JWKS_URL=https://seu-projeto.supabase.co/auth/v1/.well-known/jwks.json

WHATSAPP_NOTIFICATION_MODE=manual
WHATSAPP_API_VERSION=v22.0

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM_NAME=Torinno FC
EMAIL_FROM_ADDRESS=seu-email@gmail.com
```

Gere o Prisma Client, aplique as migrations e inicie a API:

```bash
npm run db:generate
npm run db:deploy
npm run dev
```

A API estará disponível, por padrão, em `http://localhost:4000`.

## Scripts disponíveis

### Frontend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o Vite em modo de desenvolvimento. |
| `npm run build` | Gera a versão de produção. |
| `npm run lint` | Analisa o código da pasta `src` com Oxlint. |

### Backend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API com recarregamento automático. |
| `npm start` | Inicia a API em modo de produção. |
| `npm run check` | Verifica a sintaxe dos principais arquivos do backend. |
| `npm run db:generate` | Gera o Prisma Client. |
| `npm run db:migrate -- --name nome` | Cria e aplica uma migration de desenvolvimento. |
| `npm run db:deploy` | Aplica migrations existentes em produção. |
| `npm run db:studio` | Abre o Prisma Studio. |
| `npm run render:build` | Instala dependências e gera o Prisma Client no Render. |

## Banco de dados

No Supabase Pooler, utilize:

- `DATABASE_URL` na porta `6543`, com Transaction Pooler, para a API em execução.
- `DIRECT_URL` na porta `5432`, com Session Pooler, para as migrations.

O usuário de conexão deve seguir o formato `postgres.<project-ref>`. Consulte [back-end/PRISMA.md](./back-end/PRISMA.md) para instruções detalhadas.

## WhatsApp

A integração pode operar em dois modos:

- `manual`: abre o grupo e copia a mensagem para envio pelo usuário, sem credenciais externas.
- `cloud_api`: utiliza a API oficial da Meta para envio automático, quando a conta possui acesso necessário.

A configuração completa está em [back-end/WHATSAPP_NOTIFICATIONS.md](./back-end/WHATSAPP_NOTIFICATIONS.md).

## Autorização e segurança

- O frontend envia o token do Supabase no cabeçalho `Authorization: Bearer <access_token>`.
- O backend valida o usuário e consulta `profiles.role` como fonte de verdade para permissões.
- Chaves secretas, URLs do banco e credenciais SMTP devem existir apenas no backend.
- O arquivo `.env` não deve ser versionado.
- A variável `ADMIN_API_KEY` existe somente para compatibilidade legada interna e não deve ser exposta no frontend.

## Deploy

### Frontend

Gere os arquivos estáticos com:

```bash
cd front-end
npm run build
```

Publique a pasta `front-end/dist` no serviço de hospedagem escolhido e configure as variáveis `VITE_*` no ambiente de build.

### Backend no Render

- Diretório raiz: `back-end`
- Build command: `npm run render:build`
- Start command: `npm start`

Cadastre todas as variáveis do `back-end/.env` no painel do serviço. Aplique `npm run db:deploy` somente após validar as credenciais de conexão do Supabase.

## Documentação adicional

- [Configuração do Prisma](./back-end/PRISMA.md)
- [Notificações pelo WhatsApp](./back-end/WHATSAPP_NOTIFICATIONS.md)

## Autor

Desenvolvido por [Harlen](https://github.com/Harlen539).

---

<div align="center">
  Feito para organizar, acompanhar e fortalecer o Torinno FC.
</div>
