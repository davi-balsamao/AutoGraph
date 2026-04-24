# AutoGraph - Gestão Gráfica Inteligente

## 1. Objetivo do Projeto
O projeto visa eliminar a fricção no atendimento de gráficas e a falta de visibilidade no status dos pedidos. A solução consiste em uma plataforma integrada onde:

* **Atendimento Automatizado:** O cliente inicia o contato via **WhatsApp Business API**, onde um chatbot com IA (LangChain + RAG) realiza a triagem, responde dúvidas técnicas sobre impressões e gera orçamentos automáticos com base nas regras de negócio da gráfica.
* **Geração de Ordem de Serviço (OS):** Após o fechamento do pedido via chat, o sistema cria automaticamente uma OS no banco de dados e notifica o gerente em tempo real.
* **Acompanhamento em Tempo Real:** O cliente recebe credenciais de acesso para um **App Flutter**, onde pode acompanhar o histórico e o status de produção da sua demanda (ex: "Em Impressão", "Pronto para Retirada").
* **Gestão Centralizada:** O gerente utiliza um dashboard no App para gerir a fila de produção, interagir com dados extraídos pela IA e disparar notificações push para os clientes.

## 2. Definição da Stack Técnica

### **Frontend (Mobile & Web)**
* **Tecnologia:** **Flutter**.
* **Perfis de Acesso:** Interface distinta para **Cliente** (rastreio e histórico) e **Fornecedor/Gerente** (gestão de OS e dashboard).

### **Backend (API)**
* **Ambiente de Execução:** **Node.js**.
* **Arquitetura:** **Layered Architecture** (Controller-Service-Repository) para garantir separação de responsabilidades e escalabilidade.

### **Inteligência Artificial & Integrações**
* **Orquestração:** **LangChain**.
* **Técnica de IA:** **RAG (Retrieval-Augmented Generation)** utilizando um **Vector Database** (ex: PGVector no Postgres) para consulta de catálogos e preços da gráfica.
* **Canal de Entrada:** **WhatsApp Business API (Cloud API)**.

### **Banco de Dados**
* **Principal:** **PostgreSQL** (Relacional), ideal para consistência de ordens de serviço e dados de clientes.

### **Infraestrutura & Notificações**
* **Notificações Push:** **Firebase Cloud Messaging (FCM)** para alertas de mudança de status e novas OS.
* **Virtualização:** **Docker / LXC** para garantir que o ambiente de desenvolvimento seja idêntico ao de produção.

## Exemplo de Estrutura de Pastas
```plaintext
/AutoGraph
│
├── docker-compose.yml         # Orquestra o Banco (Postgres) e o Backend (Node)
├── README.md                  # Documentação principal para o time
├── .gitignore
│
├── backend/                   # 100% Node.js
│   ├── Dockerfile             # Receita para conteinerizar a API
│   ├── package.json
│   ├── .env                   # Variáveis sensíveis (Tokens do Zap, OpenAI, DB)
│   └── src/
│       ├── config/            # Configurações globais (Conexão DB, LangChain, Firebase)
│       ├── routes/            # Definição dos endpoints (ex: POST /webhook)
│       ├── controllers/       # Ponto de entrada: Recebe a requisição HTTP e devolve a resposta
│       ├── services/          # O CÉREBRO: Regras de negócio, IA, orçamentos
│       ├── repositories/      # Comunicação exclusiva com o banco de dados (SQL/ORM)
│       ├── models/            # Definição das tabelas (Schemas)
│       └── utils/             # Funções de apoio (formatar datas, mascarar telefone)
│
└── frontend/                  # 100% Flutter
    ├── pubspec.yaml           # Dependências do App
    └── lib/
        ├── main.dart          # Ponto de partida do App
        ├── core/              # Coisas globais (Temas, Cores, Cliente HTTP/Dio)
        └── features/          # Divisão do app por funcionalidades
            ├── auth/          # Login (Telas, Controllers e Repositories locais)
            ├── os_cliente/    # Área do cliente (Rastreio da OS)
            └── admin_grafica/ # Área do gerente (Kanban, dashboard)
```