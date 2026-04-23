# Checklist de Correções Pós-Code Review

Este documento mapeia as falhas identificadas pelo Agente Investigador e o plano de ação para resolvê-las antes do deploy na AWS.

## 🔴 Pontos Críticos (Bloqueantes)

### 1. Segurança: Vulnerabilidade de Bypass de Identidade
- [ ] **Problema**: O sistema confia nos headers `x-user-role` e `x-barbershop-id`. Um atacante pode forjar esses valores.
- [ ] **Correção**: Refatorar o middleware global no `server.ts` para validar o Token JWT e extrair `userId`, `role` e `tenantId` exclusivamente do payload assinado.
- [ ] **Ação**: Remover o suporte a esses headers em ambiente de produção.

### 2. Arquitetura: Instâncias do PrismaClient
- [ ] **Problema**: `new PrismaClient()` está sendo chamado em múltiplos arquivos. Risco de queda do banco por excesso de conexões.
- [ ] **Correção**: Implementar o padrão **Singleton** em `src/lib/prisma.ts` e exportar uma única instância para todo o app.

### 3. Robustez: Race Condition no Agendamento
- [ ] **Problema**: Dois agendamentos podem ser criados para o mesmo horário em milissegundos idênticos.
- [ ] **Correção**: Implementar `$transaction` com isolamento `Serializable` no `AppointmentService` ou adicionar uma constraint de exclusão no PostgreSQL.

## 🟡 Melhorias (Não Bloqueantes)

### 4. Gestão de Secrets
- [ ] **Problema**: Fallbacks de strings (como `'super-secret-key'`) estão no código.
- [ ] **Correção**: Forçar erro de inicialização se `JWT_SECRET` não estiver presente no `.env`.

### 5. Otimização de Docker
- [ ] **Problema**: Dockerfiles podem ser mais enxutos.
- [ ] **Correção**: Revisar camadas e remover arquivos de dev da imagem final.

---
*Mapeado em: 23 de Abril de 2026*
