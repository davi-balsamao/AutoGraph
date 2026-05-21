# Autograph — Handoff Flutter

Este pacote contém tudo o que o Claude Code (ou um dev humano) precisa pra reimplementar o app `autograph` em Flutter a partir dos mockups visuais deste projeto.

## Estrutura

```
handoff/
├── README.md                  ← este arquivo
├── design_tokens.dart         ← cores, tipografia, espaçamento, raios (constantes Dart)
├── mobile_screens.md          ← spec das 10 telas mobile do CLIENTE (incl. login/signup, light + dark)
├── admin_screens.md           ← spec das 8 telas admin DESKTOP (incl. login)
├── admin_mobile_screens.md    ← spec das 10 telas admin MOBILE (incl. login, mais, conversa aberta)
├── image_prompts.md           ← prompts pro Gemini gerar fotos dos produtos
└── assets/
    ├── logo_autograph.svg     ← logo principal (mark + wordmark)
    ├── logo_mark.svg          ← só o mark (favicon, splash)
    ├── product_panfleto.svg   ← placeholder geométrico (substituir por foto real)
    ├── product_banner.svg
    ├── product_bloco.svg
    └── product_apostila.svg
```

## Como usar este pacote no Claude Code

1. Clone o repo `AutoGraph` (branch `fix/Frontend`) e abra no Claude Code
2. Copie esta pasta `handoff/` pra dentro do repo (pode ser `frontend/design/handoff/`)
3. Diga ao Claude Code:
   > "Quero migrar o app pra esses mockups. Leia `design/handoff/README.md`,
   > o arquivo de specs da área que vai implementar (`mobile_screens.md` p/ app
   > cliente, `admin_mobile_screens.md` p/ app do gerente, ou `admin_screens.md`
   > p/ painel desktop) e `design_tokens.dart`. Implemente seguindo o design
   > e usando `flutter_svg` pra carregar os SVGs."
4. Mantenha os arquivos `Autograph App.html`, `Autograph Admin.html` e
   `Autograph Admin Mobile.html` abertos no navegador como referência visual

## Arquitetura proposta

```
lib/
├── core/
│   ├── theme/
│   │   ├── ag_colors.dart       ← (copiar de design_tokens.dart)
│   │   ├── ag_typography.dart
│   │   ├── ag_spacing.dart
│   │   └── ag_theme.dart        ← ThemeData light/dark
│   └── widgets/
│       ├── ag_logo.dart         ← AGLogoMark + AGWordmark
│       ├── ag_button.dart       ← PrimaryButton, SecondaryButton
│       ├── ag_tag.dart          ← Badge/tag colorido
│       ├── ag_product_glyph.dart← Usa flutter_svg pra carregar assets
│       └── ag_bottom_tab_bar.dart
└── features/
    ├── customer/                ← App mobile (cliente)
    │   ├── welcome/
    │   ├── home/
    │   ├── catalog/
    │   ├── product_detail/
    │   ├── chat/                ← Tela do agente (animada)
    │   ├── orders/
    │   ├── tracking/
    │   └── account/
    └── admin/
        ├── shared/              ← AdminSidebar (desktop), AdminTabBar (mobile),
        │                          AdminMobileHeader, KanbanCard (compartilhado)
        ├── dashboard/           ← responsive: desktop layout grid + mobile stack
        ├── kanban/              ← desktop: 5 colunas | mobile: tabs + lista
        ├── chat/                ← desktop: 3 colunas | mobile: lista de conversas
        ├── orders_history/      ← desktop: tabela | mobile: cards stacked
        ├── finance/             ← layout adaptativo
        ├── catalog/             ← layout adaptativo
        └── users/               ← layout adaptativo
```

**Estratégia de responsividade:** cada feature do admin tem um único entrypoint
que escolhe layout via `LayoutBuilder` + breakpoint em 768dp.
```dart
LayoutBuilder(builder: (ctx, c) => c.maxWidth >= 768
  ? const KanbanDesktopScreen()
  : const KanbanMobileScreen())
```

## Notas críticas

### Dark mode + theme toggle
O `app-ui.jsx` define um helper `theme(dark)` que devolve as cores swappable.
Em Flutter, isso vira `ThemeData` light + dark, ambos compartilhando a brand
green (`#00ed64`). Veja `design_tokens.dart` — todos os tokens estão lá em
versão light e dark.

O **botão de troca de tema** aparece em 4 lugares:
- Tela de Login/Cadastro (cliente e admin) — ícone redondo no canto superior direito
- Welcome screen — ícone redondo (com bg semi-transparente porque é sobre teal)
- Tela de Conta (cliente) — row na seção "Preferências" + segmented control Claro/Escuro/Auto
- Sidebar do admin desktop — botão pequeno ao lado do perfil pinado
- Tela "Mais" do admin mobile — card com `ThemeToggleSwitch` (3 opções)

Em Flutter, plugue todos esses controles num `ChangeNotifier`/`Riverpod`
que atualiza `MaterialApp(themeMode: ...)` e persiste em `SharedPreferences`.

### Tipografia
Mockups usam `Inter` (Google Fonts). Em Flutter, use o pacote
`google_fonts: ^6.x` e `GoogleFonts.inter()` como `textTheme` base.
Para código/monoespaçado, `GoogleFonts.jetBrainsMono()`.

### Animação do chat
A tela "Conversa com agente" usa uma sequência scriptada de mensagens com
"typing indicator" entre elas. Em Flutter, isso é um `StreamBuilder` ou um
`AnimatedList` consumindo uma lista de eventos com delays. Veja a constante
`CHAT_SCRIPT` em `app-screens-b.jsx`.

### Status do Kanban
Os 5 status oficiais (use exatamente estas chaves no backend):
- `AGUARDANDO_APROVACAO` (cor: muted/cinza)
- `APROVADO` (cor: accent-blue)
- `EM_PROGRESSO` (cor: accent-orange)
- `EM_REVISAO` (cor: accent-purple)
- `CONCLUIDA` (cor: brand-green)

### Componentes-chave a recriar
1. **AGLogo** (mark + wordmark) — usado em todo lugar
2. **PhoneShell** mobile — status bar superior + home indicator inferior
3. **BottomTabBar** com 5 abas + badge de notificação (cliente e admin têm sets de abas diferentes)
4. **ChatBubble** (in/out) + cards especiais (orçamento, prova digital, pagamento)
5. **AdminSidebar** lateral fixa 240dp com 7 itens + perfil pinado embaixo (DESKTOP)
6. **AdminTabBar** bottom 5-tab + AdminMobileHeader com back + actions (MOBILE)
7. **KanbanColumn** + **KanbanCard** — desktop drag-and-drop (`flutter_reorderable_grid_view`)
8. **KanbanMobileCard** + segmented status tabs — mobile tap pra trocar status
9. **DataTable** customizada (não usar `DataTable` nativa — visual ficou pobre); mobile usa cards stacked

## Prioridade de implementação sugerida

**Sprint 0 (autenticação):** Login + Cadastro (cliente) + Login (admin)
**Sprint 1 (cliente essencial):** Welcome, Home, Catálogo, Chat com agente
**Sprint 2 (cliente compra):** Produto detalhe, Pedidos, Tracking, Conta (com theme toggle)
**Sprint 3 (admin mobile MVP):** Dashboard, Kanban, Chat (lista + conversa aberta), Mais
**Sprint 4 (admin desktop):** Mesmas telas em layout desktop, com `LayoutBuilder` reusando lógica
**Sprint 5 (admin completo):** Histórico, Financeiro, Catálogo, Usuários (light + dark)

## Contratos de backend que ficam claros nos mockups

### Auth
- `POST /auth/signup { name, email, phone, password }`
- `POST /auth/login { email, password }` → `{ token, user }`
- `POST /auth/admin/login { email, password }` → `{ token, user, requires2fa: true }`
- `POST /auth/2fa/verify { code }`
- `POST /auth/forgot { email }`

### Pedidos / OSs
- `POST /orders` com campos: produto, formato, papel, cores, qtd, arquivo_url
- `GET /orders?status=...` paginado
- `PATCH /orders/:id { status: "EM_PROGRESSO" }`

### Conversas
- `GET /conversations?escalated=true`
- `POST /conversations/:id/messages { text, sender: "human|agent" }`
- `POST /conversations/:id/takeover` — humano assume conversa

### Financeiro / catálogo / usuários
- `GET /finance/summary?period=2025-05`
- `GET /catalog/products` (10 SKUs)
- `PUT /catalog/products/:sku { active, price, cost }`
- `GET /users?segment=VIP`

### Preferências do usuário
- `PATCH /me/preferences { themeMode: "light|dark|auto" }`
- Persistência local: `SharedPreferences` para themeMode e último email

Os SVGs em `assets/` são placeholders. Substitua por fotos reais dos produtos
da gráfica assim que tiver as fotos — veja `image_prompts.md` para prompts
prontos pro Gemini gerar essas fotos.
