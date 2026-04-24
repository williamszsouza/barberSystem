# Contexto do Projeto: BarberSystem (SaaS Multi-tenant)

Este documento serve como a "memória" técnica do projeto para ser utilizado em diferentes sessões ou workspaces do Gemini CLI.

## 🛠 Tecnologias Principais
- **Backend:** Node.js, Fastify (focado em performance).
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn/UI.
- **Banco de Dados:** PostgreSQL via Prisma ORM.
- **Mensageria/Filas:** Redis com BullMQ (notificações assíncronas).
- **Infraestrutura:** Docker (Docker Compose para dev e prod).

## 🏗 Arquitetura
- **Multi-tenancy:** Baseado em identificadores de estabelecimento (`barbershopId`).
- **Segurança:** Autenticação JWT com hooks de `preHandler` no Fastify para validação de tokens e isolamento de dados por estabelecimento.
- **Roles (Papéis):** `SUPERADMIN`, `ADMIN`, `BARBER`, `CUSTOMER`.
- **Fluxos:**
    - Registro de Barbearia -> Criação de Admin -> Configuração de Serviços -> Agendamentos.
    - Notificações: Disparadas via filas para evitar bloqueio da thread principal.

## 📂 Estrutura de Pastas Relevante
- `src/app.ts`: Configuração central do servidor e middlewares.
- `prisma/schema.prisma`: Definição de todas as entidades e relacionamentos.
- `src/lib/`: Integrações (mail.ts, queue.ts, prisma.ts).
- `frontend/src/app/`: Estrutura de rotas do Next.js.

## 🔑 Decisões de Design
- Uso de hooks do Fastify para injeção de contexto global.
- Validação rigorosa de `establishmentId` em todas as rotas protegidas para garantir o isolamento entre clientes (SaaS).
- Separação clara entre backend e frontend (monorepo simples).

---
*Gerado automaticamente pelo Gemini CLI para portabilidade de contexto.*
