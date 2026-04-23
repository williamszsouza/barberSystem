# BarberSystem - Sistema de Agendamento Profissional

Bem-vindo ao **BarberSystem**, uma solução completa para gestão de barbearias com suporte a multi-tenancy, agendamentos inteligentes e notificações via WhatsApp.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js + Fastify**: API de alta performance.
- **Prisma ORM**: Modelagem de dados e integração com PostgreSQL.
- **BullMQ + Redis**: Gestão de filas para notificações em background.
- **Zod**: Validação rigorosa de dados.
- **JWT + Bcrypt**: Autenticação segura e proteção de dados.

### Frontend
- **Next.js 14 (App Router)**: Framework React moderno.
- **shadcn/ui**: Componentes de interface de alto nível.
- **Tailwind CSS**: Estilização moderna e responsiva.
- **React Query**: Gerenciamento de estado e cache de API.

---

## 🏛️ Arquitetura do Sistema

### 1. Multi-tenancy (Isolamento de Dados)
O sistema foi desenhado para suportar múltiplas barbearias na mesma base de dados. Cada tabela importante possui um `barbershopId`, garantindo que um administrador nunca acesse os dados de outro estabelecimento.

### 2. Fluxo de Agendamento
- **Validação de Conflitos**: O backend verifica se o barbeiro já possui agendamentos no horário solicitado, considerando a duração de cada serviço.
- **Notificações**: Ao criar um agendamento, um "Job" é enviado para o Redis e processado por um Worker, que dispara lembretes (preparado para Evolution API).

### 3. Gestão Financeira e BI
- **Dashboard Admin**: Visão em tempo real do faturamento mensal, ticket médio e volume de clientes.
- **Relatórios por Barbeiro**: O sistema permite ver exatamente quanto cada profissional faturou no período selecionado.
- **Exportação de Dados**: Capacidade de exportar relatórios financeiros em formato CSV (compatível com Excel) para conciliação bancária ou contabilidade.

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Docker e Docker Desktop instalados.
- Node.js v18+.

### Passo 1: Infraestrutura (Banco e Redis)
Na raiz do projeto, suba os containers:
```cmd
docker-compose up -d
```

### Passo 2: Configuração do Backend
1. Instale as dependências: `npm install`
2. Configure o arquivo `.env` (use o modelo abaixo):
   ```env
   DATABASE_URL="postgresql://admin:password@localhost:5432/barbershop_db?schema=public"
   REDIS_HOST="127.0.0.1"
   REDIS_PORT=6379
   JWT_SECRET="barber-secret-key"
   ```
3. Rode as migrations e o seed:
   ```cmd
   npx prisma migrate dev
   npx tsx prisma/seed.ts
   ```
4. Inicie o servidor: `npm run dev` (Porta 3333).

### Passo 3: Configuração do Frontend
1. Entre na pasta: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie o Next.js: `npm run dev` (Porta 3000 ou 3001).

---

## 📍 Endpoints Principais (API)

- `POST /auth/register`: Cadastro de novo usuário.
- `POST /auth/login`: Autenticação.
- `GET /appointments/available-times`: Consulta de horários livres.
- `POST /appointments`: Realizar novo agendamento.
- `PATCH /appointments/:id/complete`: Concluir atendimento (Gera financeiro).
- `GET /appointments/earnings`: Relatório de faturamento (Admin).

---

## 📝 Notas de Versão
- **v1.0.0**: Implementação da base Multi-tenant, Fluxo de Agendamento, Dashboard Admin e Integração shadcn/ui.
