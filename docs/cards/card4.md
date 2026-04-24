# [Integração] Criação e Configuração do App no Meta Developers

## 📖 Descrição
Para que a AutoGraph consiga receber e enviar mensagens através do WhatsApp, precisamos configurar a aplicação na plataforma da Meta. O objetivo é criar o App, gerar os tokens de acesso temporários/permanentes e ter as credenciais em mãos para plugar no código.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] App criado na plataforma [Meta for Developers](https://developers.facebook.com/).
- [ ] Produto "WhatsApp" adicionado ao App.
- [ ] Número de telefone de teste gerado e configurado para envio de mensagens.
- [ ] Access Token e Identificador do Telefone copiados e salvos num cofre ou `.env` local.
- [ ] Permissões necessárias concedidas no painel da Meta.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Fazer login no portal Meta Developers.
- [ ] Criar novo aplicativo do tipo "Business".
- [ ] Configurar a seção do WhatsApp (WhatsApp Cloud API).
- [ ] Adicionar número de telefone destinatário autorizado (para testes).
- [ ] Enviar uma mensagem de teste pelo próprio painel da Meta para validar.
- [ ] Documentar os tokens de acesso (App ID, App Secret, Token de Acesso, Phone Number ID) e a Verification Token.

## 👤 Atribuição
**Responsável:** [A Definir - Líder Técnico / Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 0.5 Dia útil.

## 🏷️ Etiquetas (Labels)
`whatsapp-api` `configuracao` `prioridade-alta` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [Guia Oficial da API Cloud do WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api)

## 🔀 Relacionamento entre Cards
- **Depende de:** N/A.
- **Bloqueia:** Card 5 (Validação do Webhook).
