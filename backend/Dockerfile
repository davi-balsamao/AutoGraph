# Imagem base do Node.js
FROM node:20

# Pasta de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências (por enquanto vazio)
RUN npm install

# Copia o restante dos arquivos (quando começar a codar)
COPY . .

# Expõe a porta do servidor
EXPOSE 3000

CMD ["npm", "run", "dev"]