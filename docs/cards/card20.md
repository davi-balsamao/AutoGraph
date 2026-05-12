# [Backend/IA] Gerar Resumo e Mensagem Sugerida na OS

## 📖 Descrição
No momento em que a IA finaliza o atendimento e cria a OS, ela tem todo o contexto na memória. O backend deve aproveitar para pedir ao LLM que gere um texto de "Mensagem Sugerida" formatado de forma que a recepcionista possa apenas copiar e colar para o cliente via WhatsApp Business.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Ao salvar a OS (`status: AGUARDANDO_ORCAMENTO`), o sistema dispara um último prompt interno.
- [ ] O prompt gera um resumo formatado: "Olá [Nome], vimos que você quer [Quantidade] [Produto]. O valor fica X...".
- [ ] Esse resumo é salvo em um campo `mensagem_sugerida` na tabela `OrdensDeServico`.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Adicionar coluna `mensagem_sugerida` (TEXT) na tabela `OrdensDeServico`.
- [ ] Criar rotina no backend para "resumir conversa para transbordo" usando a IA.
- [ ] Integrar essa chamada na rotina que aprova a OS.
- [ ] Atualizar o retorno do endpoint de GET OS para incluir o campo.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `ia` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 19 (IA finaliza triagem).
- **Bloqueia:** Card 25 (Tela da OS no Flutter).
