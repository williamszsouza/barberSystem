# Build Stage
FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm install

# Copia o resto do código
COPY . .

# Gera o Prisma Client e faz o build do TS
RUN npx prisma generate
RUN npm run build

# Porta configurada
EXPOSE 3334

# Comando de inicialização com migração automática
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
