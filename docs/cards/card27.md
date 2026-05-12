# [Frontend] Refinamento UX: Loader, Toast e Erros

## 📖 Descrição
Garantir que o aplicativo não quebre silenciosamente durante a apresentação. Adicionar indicadores visuais de carregamento e mensagens de sucesso/erro.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Toda chamada HTTP (login, buscar OS, atualizar status) exibe um *loading indicator* (ex: `CircularProgressIndicator`).
- [ ] Se a API falhar, o app mostra um `SnackBar` (Toast) avisando o usuário.
- [ ] Ao copiar a mensagem para o WhatsApp com sucesso, mostra Toast "Copiado!".

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Revisar blocos `try/catch` nas chamadas do `Dio`/`http`.
- [ ] Implementar mixin ou utilitário global para disparar SnackBars.
- [ ] Controlar booleano `isLoading` nas gerências de estado de cada tela.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 0.5 Dia útil.

## 🏷️ Etiquetas (Labels)
`frontend` `flutter` `ux` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Todos os cards de Flutter finalizados.
- **Bloqueia:** Teste Final.
