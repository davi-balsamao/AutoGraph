# Walkthrough: Mock WhatsApp Cloud API (Card 4 v2)

Este documento resume as implementações realizadas para preparar o ambiente de simulação do WhatsApp, visando desacoplar temporariamente o desenvolvimento da plataforma real da Meta para seguir avançando com o fluxo de sistema.

## O que foi feito

### 1. Variáveis de Ambiente
As variáveis responsáveis por ativar o modo de mock e a chave de validação de webhook foram incluídas nas configurações do backend.

- `backend/.env.example` foi atualizado para conter:
  ```env
  WEBHOOK_VERIFY_TOKEN=dev_token_123
  USE_MOCK_WHATSAPP=true
  ```
- O arquivo real `backend/.env` também foi atualizado/criado contendo esses valores para o desenvolvimento local rodar com a flag de Mock ativada.

### 2. Serviço Mock do WhatsApp
Criamos a fundação para o envio de mensagens respeitando a arquitetura definida.

- Arquivo: [backend/src/services/whatsapp.service.ts](file:///c:/Davi/AutoGraph/backend/src/services/whatsapp.service.ts)
- A classe base possui um método de envio que avalia a variável `USE_MOCK_WHATSAPP`. Se for `'true'`, ela faz um log console sem disparar nenhuma requisição HTTP, economizando custos e tempo, permitindo o avanço nos testes das etapas de envio.

### 3. Scripts de Teste HTTP
A validação do Webhook sem a ferramenta oficial da Meta pode ser testada localmente.

- Criado o script: [simulate_webhook.http](file:///c:/Davi/AutoGraph/simulate_webhook.http) na raiz do projeto.
- Contém duas chamadas cruciais:
  - **GET**: Para imitar o handshake de verificação e aprovação do Webhook.
  - **POST**: Para disparar uma mensagem fake de usuário (`Olá, gostaria de imprimir 1000 cartões de visita.`), usando a exata estrutura de Payload que o WhatsApp Cloud API enviará para o webhook do backend da Gráfica.

> [!TIP]
> **Como testar:** Com o backend rodando, você pode usar a extensão "REST Client" no seu VS Code, ir até o arquivo `simulate_webhook.http` e clicar em `Send Request`.

Essas implementações marcam o sucesso e a conclusão dos artefatos técnicos previstos no `Card 4 v2`.
