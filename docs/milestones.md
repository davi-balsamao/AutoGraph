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

# Milestone 3: Semana 3 - MVP (Flutter Admin & Handover Inteligente)
## 🎯 Objetivo da Semana
Adaptar a estratégia para a entrega do dia 13/05. O app Flutter será focado exclusivamente no uso interno (Recepcionista) como um Dashboard de gestão das Ordens de Serviço pré-criadas pela IA. O fluxo de fechamento será via "Cópia de Mensagem" para o WhatsApp secundário da gráfica (Workaround de 2 números), eliminando a complexidade de WebSockets.

### 📌 Entregáveis (Definition of Done)
- [ ] IA finaliza a triagem sozinha, gera o resumo da OS e encerra sua participação enviando a mensagem de transbordo ("nossa equipe entrará em contato").
- [ ] Endpoint `GET /api/os/{id}/mensagens` criado para fornecer o histórico auditável da triagem.
- [ ] App Flutter operando como Dashboard Admin (Login da Recepcionista, Lista de Novas OS).
- [ ] Tela de Detalhes da OS no Flutter contendo: Dados extraídos, Histórico Somente Leitura e Botão "Copiar Mensagem".
- [ ] Deploy do Backend (ex: Render/VPS) e Banco de Dados rodando em nuvem para a apresentação final.
- [ ] Teste Ponta-a-Ponta validando o "Caminho Feliz" completo para a banca avaliadora.