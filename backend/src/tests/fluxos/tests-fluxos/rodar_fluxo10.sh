#!/usr/bin/env bash

# Script para automatizar o teste do Fluxo 10
# Ele inicia o banco, sobe o backend em segundo plano, executa o teste Jest,
# salva os resultados em 'resultado_fluxo10.txt' e depois encerra o backend.

# Cores para o terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem Cor

echo -e "${YELLOW}🔄 [1/4] Iniciando o banco de dados com docker compose...${NC}"
docker compose up -d db
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Falha ao subir o banco de dados no Docker.${NC}"
  exit 1
fi

echo -e "${YELLOW}🔄 [2/4] Preparando o backend e Prisma Client...${NC}"
cd backend || exit 1

# Libera a porta 3000 caso algum processo antigo tenha ficado preso
echo -e "🧹 Liberando a porta 3000..."
fuser -k 3000/tcp >/dev/null 2>&1 || true
kill -9 $(lsof -t -i:3000) >/dev/null 2>&1 || true

# Garante que os tipos do Prisma estejam gerados localmente e atualizados
echo -e "⚙️ Gerando tipos atualizados do Prisma Client..."
npx prisma generate

# Reseta o banco de dados e aplica as migrações do zero para recriar todas as tabelas
echo -e "⚙️ Resetando o banco de dados e aplicando migrações do zero..."
npx prisma migrate reset --force

# Executa os seeds manualmente para garantir que os dados de teste existam
echo -e "⚙️ Rodando os seeds de dados iniciais e base de conhecimento..."
npx ts-node-dev prisma/seed.ts
npm run seed:knowledge

# Garante que o log antigo seja limpo
rm -f server.log

# Inicia o servidor em segundo plano e captura o PID
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Função para garantir que o processo do servidor seja encerrado ao sair
cleanup() {
  echo -e "\n${YELLOW}🧹 [4/4] Limpando processos em segundo plano...${NC}"
  if ps -p $SERVER_PID > /dev/null; then
    echo -e "⏹️ Parando o servidor backend (PID: $SERVER_PID)..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
  fi
  echo -e "${GREEN}✨ Concluído!${NC}"
}
trap cleanup EXIT

# Aguarda o servidor responder na porta 3000
echo -e "⏳ Aguardando o servidor backend estar pronto na porta 3000..."
attempts=0
max_attempts=30
server_ready=false

while [ $attempts -lt $max_attempts ]; do
  if curl -s http://localhost:3000/ > /dev/null; then
    server_ready=true
    break
  fi
  sleep 1.5
  attempts=$((attempts+1))
  echo -n "."
done
echo ""

if [ "$server_ready" = true ]; then
  echo -e "${GREEN}✅ Servidor backend está online e pronto!${NC}"
  
  echo -e "${YELLOW}🧪 [3/4] Executando o teste do Fluxo 10...${NC}"
  # Executa o jest direcionando a saída tanto para o terminal quanto para o arquivo resultado_fluxo10.txt na raiz
  npx jest src/tests/fluxos/fluxo10.test.ts --forceExit 2>&1 | tee ../resultado_fluxo10.txt
  
  echo -e "\n${GREEN}💾 Resultado do teste salvo em: ${YELLOW}resultado_fluxo10.txt${NC}"
else
  echo -e "${RED}❌ O servidor backend falhou ao iniciar dentro de 45 segundos.${NC}"
  echo -e "${YELLOW}📄 Últimas linhas do 'backend/server.log':${NC}"
  tail -n 20 server.log
  exit 1
fi
