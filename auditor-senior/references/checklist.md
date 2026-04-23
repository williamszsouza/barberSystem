# Checklist de Auditoria Sênior

Use este guia para realizar uma análise linha por linha do código. Não prossiga para o próximo item sem validar o anterior.

## 1. Segurança (Security)
- [ ] **Bypass de Identidade**: O `userId` ou `tenantId` são extraídos de headers não validados? (Deve usar JWT).
- [ ] **Proteção de Rotas**: Rotas de admin/superadmin possuem hooks de `preHandler` verificando `role`?
- [ ] **Exposição de Segredos**: Existe algum segredo (API Key, JWT Secret) hardcoded ou com fallback inseguro no código?
- [ ] **Injeção de SQL/NoSQL**: O Prisma está sendo usado corretamente sem queries brutas (`prisma.$queryRaw`) não higienizadas?

## 2. Banco de Dados & Performance
- [ ] **Prisma Singleton**: Existe apenas UMA instância do `PrismaClient` sendo compartilhada? (Procure por múltiplos `new PrismaClient()`).
- [ ] **Race Conditions**: Operações críticas de escrita (agendamentos, pagamentos) usam `$transaction` com nível de isolamento adequado (`Serializable`)?
- [ ] **N+1 Queries**: Verifique se loops estão fazendo queries individuais em vez de usar `include` ou `select`.
- [ ] **Índices**: Campos usados em filtros frequentes (`barbershopId`, `date`, `email`) possuem índices no `schema.prisma`?

## 3. Arquitetura & Manutenibilidade
- [ ] **Singleton Pattern**: Serviços e bibliotecas compartilhadas estão centralizadas em `src/lib`?
- [ ] **Tipagem TypeScript**: Existem usos excessivos de `any` que mascaram erros de lógica?
- [ ] **Separação de Interesses**: Rotas cuidam apenas da interface HTTP, delegando a lógica para Services?

## 4. Prontidão para AWS (Cloud Readiness)
- [ ] **Dockerização**: Os Dockerfiles usam multi-stage builds? O tamanho da imagem final é otimizado?
- [ ] **Variáveis de Ambiente**: O sistema quebra graciosamente se uma variável obrigatória estiver ausente?
- [ ] **Portas**: O servidor está escutando em `0.0.0.0` (necessário para Docker) e as portas estão mapeadas corretamente?
