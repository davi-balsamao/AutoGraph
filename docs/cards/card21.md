# [Backend] Endpoint de Histórico da Conversa (Somente Leitura)

## 📖 Descrição
Para que a recepcionista audite as informações da triagem, o app Flutter precisa exibir a transcrição do atendimento. O backend deve prover um endpoint GET que retorne as mensagens vinculadas a uma OS ou Cliente.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Rota `GET /api/os/:id/mensagens` criada e protegida.
- [ ] Retorna um JSON contendo o array de mensagens na ordem cronológica correta.
- [ ] O JSON deve indicar claramente o remetente de cada mensagem (`cliente` vs `ia`).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar método no `ConversationRepository` para buscar as mensagens por ID da OS.
- [ ] Criar rota e controller correspondentes.
- [ ] Documentar formato do retorno.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 0.5 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `api` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Base de Dados M1 e Memória M2.
- **Bloqueia:** Card 26 (UI Histórico no Flutter).
