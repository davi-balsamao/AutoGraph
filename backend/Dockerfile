# Estágio de Build
FROM node:20-slim AS builder

# Instala dependências de sistema para o Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /usr/src/app

# Copia configurações de dependências
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Instala todas as dependências
RUN npm install

# Copia o código fonte
COPY src ./src/

# Gera o Prisma Client e compila o TypeScript
RUN npx prisma generate
RUN npm run build

# Estágio de Produção
FROM node:20-slim

# Instala dependências de sistema para o Prisma
RUN apt-get update -y && apt-get install -y openssl && apt-get clean

WORKDIR /usr/src/app

# Copia os arquivos compilados e dependências do estágio anterior
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]