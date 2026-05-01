# Como usar tudo isso na prática?
Para ver esse ambiente rodando no seu computador (certifique-se de que o Docker Desktop ou o serviço Docker esteja aberto na sua máquina Windows):

Subir o ambiente: No seu terminal, pasta raiz (c:\AutoGraph), rode o comando abaixo:

```bash
docker compose up -d --build
```
*(O -d roda de forma oculta para não prender o terminal e o --build garante que ele leia seu Dockerfile mais recente).*

Checar se está rodando e ler os logs: Você pode ver a saúde da infraestrutura (e confirmar o "Backend pronto!") lendo os logs em tempo real:

```bash
docker compose logs -f
```
*(Para sair da tela de logs, basta apertar CTRL + C).*

Para desligar a infraestrutura (quando acabar de trabalhar):

```bash
docker compose down
```

Resumo da obra: Vocês deixaram pronto um esqueleto Node.js rodando ininterruptamente e plugado (via rede e URL de ambiente) em um PostgreSQL, prontos para a próxima etapa, que será abrir a pasta do backend, começar a instalar os pacotes reais (ex: npm install express) e começar a escrever as rotas!