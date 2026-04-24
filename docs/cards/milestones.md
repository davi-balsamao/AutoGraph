# Milestone 1: Semana 1 - Fundação e Conectividade
## 🎯 Objetivo da Semana
Estabelecer a infraestrutura base, modelagem inicial do banco de dados e a comunicação principal entre a API do WhatsApp e o Backend. **Não focaremos em IA ou telas nesta etapa.** O sucesso é provar a ingestão de dados.

### 📌 Entregáveis (Definition of Done)
- [ ] Container `docker-compose` rodando PostgreSQL e Node.js localmente.
- [ ] Modelagem de Dados Base implementada no banco (`Clientes`, `OrdensDeServico`, `Mensagens`).
- [ ] App criado no Meta Developers com Webhook assinado e validado.
- [ ] Fluxo Base concluído: Mensagem Zap -> Node.js (Webhook) -> Salva no Banco -> Responde 200 OK.
- [ ] Projeto Flutter inicializado (estrutura de pastas do Monorepo e rotas vazias).

# Milestone 2: Semana 2 - O Cérebro (IA e RAG)
## 🎯 Objetivo da Semana
Implementar a inteligência do negócio. O LangChain atuará como o motor principal, utilizando RAG para ler as regras e preços da gráfica, realizando o atendimento e estruturando a Ordem de Serviço sem intervenção humana.

### 📌 Entregáveis (Definition of Done)
- [ ] Base de Conhecimento (Vector DB) alimentada com tabela de preços, gramaturas e prazos.
- [ ] LangChain rodando dentro do Node.js, acionado assincronamente após o recebimento da mensagem.
- [ ] Bot RAG respondendo dúvidas complexas com precisão (zero alucinações de preço).
- [ ] Pipeline de Extração: IA capta as entidades (Tamanho, Cor, Quantidade, Arquivo) e cadastra a OS no PostgreSQL.

# Milestone 3: Semana 3 - UX e Tempo Real (Flutter + FCM)
## 🎯 Objetivo da Semana
Dar vida às interfaces e garantir a reatividade. O App consumirá a API e o gestor da gráfica não precisará atualizar a tela para ver um novo pedido: o sistema avisará via Push Notification.

### 📌 Entregáveis (Definition of Done)
- [ ] Tela do **Cliente** funcional (Login via OTP/Senha Fixa e visualização do status da sua OS).
- [ ] Tela do **Fornecedor/Gerente** funcional (Dashboard com fila de OS e mudança de status).
- [ ] Configuração do Firebase Cloud Messaging (FCM) no Backend (Emissor) e Frontend (Receptor).
- [ ] Gatilho de Notificação: Banco salva nova OS -> Node.js dispara FCM -> Celular do Fornecedor recebe o alerta em < 2 segundos.

# Milestone 4: Semana 4 - Refinamento, Borda e Pitch
## 🎯 Objetivo da Semana
Blindar a aplicação contra erros do usuário, tratar arquivos pesados (comum em gráficas) e empacotar o projeto para a apresentação final (Demo).

### 📌 Entregáveis (Definition of Done)
- [ ] Tratamento de Casos de Borda: Bot lida corretamente com envio de imagens e PDFs (extrai a URL do Zap e salva em Storage).
- [ ] Documentação da API finalizada (Swagger ou coleção Postman com todos os endpoints).
- [ ] Revisão de Código e unificação final no branch `main` do GitHub.
- [ ] Preparação da Demo (10 minutos): Ensaio do fluxo ponta a ponta (Cliente chama no Zap -> Orça -> App Notifica -> Gerente finaliza).