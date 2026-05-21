# Admin mobile screens — Spec por tela (gerente, app)

7 telas mobile do app do gerente — versão portable do `admin_screens.md`.
Cada tela aceita prop `dark` (light/dark mode).
Mockups: `Autograph Admin Mobile.html`.

Tamanho-alvo: **360×720 dp** (mesmo do app cliente).

**Por que existir mobile do admin?** O gerente precisa monitorar OSs, aprovar
escalações e responder clientes a qualquer hora — fora da loja, no celular.
Não substitui o painel desktop (que é melhor pra operação intensiva), mas
cobre o uso fora do escritório.

---

## 00 · Login admin (mobile)
**Slug:** `admin_mobile/login`

```
SafeArea + padding 8,24,32,24
├─ Row[justify: flex-end]: ThemeToggleIcon
├─ Center column:
│  ├─ AGLogoMark size 56
│  ├─ Pill verde "🔒 PAINEL ADMINISTRATIVO"
│  ├─ "Entrar no painel" (heading 26/600/-0.5)
│  └─ Subtitle "Acesso restrito à equipe da gráfica"
├─ Form:
│  ├─ Field "E-mail corporativo"
│  └─ Field "Senha" (👁)
├─ Row "Manter conectado" | "Esqueci a senha"
├─ Button "Entrar no painel" verde full width
├─ 2FA hint card roxo
├─ Spacer
└─ Footer:
   ├─ "Não é da equipe? App do cliente"
   └─ "Autograph Admin v1.0"
```

---

## Componentes compartilhados (app mobile admin)

### AdminTabBar (bottom)
5 abas. Active color: `AGColors.brandTealDeep` (light) / `AGColors.brandGreen` (dark).

| Tab | Slug | Ícone | Badge dinâmico |
|---|---|---|---|
| Geral | `home` | dashboard mini | — |
| OSs | `kanban` | 3 colunas verticais | — |
| Chat | `chat` | bolha | conversas não lidas (ex: 3) |
| Pedidos | `orders` | clipboard | — |
| Mais | `more` | 3 dots | — |

### AdminMobileHeader
Largura full, 60dp altura. Suporta:
- `title` (heading bold 18dp)
- `subtitle` (caption muted)
- `back: bool` — botão circular voltar à esquerda
- `actions: Widget?` — slot direita (geralmente botão de ação primária 36dp redondo)

### Bottom bar / theme
Mesmo `theme(dark)` do cliente. Backgrounds:
- Light: `#ffffff` / surface `#f9fbfa` / surfaceSoft `#f4f7f6`
- Dark: `#001017` (bg) / `#001e2b` (elevated) / `#0a2c3a` (surface)

---

## 01 · Dashboard (Geral)
**Slug:** `admin_mobile/home` · **Tab ativa:** Geral

Lista vertical (ScrollView):
1. **GreetingBlock** — avatar D verde + "Bom dia, Davi" + sino com badge laranja
2. **Receita hero card** dark teal:
   - Eyebrow verde "RECEITA HOJE"
   - Valor enorme R$ 2.840,40
   - Delta "↑ 18% vs. ontem · 24 pedidos"
   - **Mini bar chart** 32dp (últimos 14 dias, hoje em verde, restante branco 18%)
3. **KPI grid 2×2**: OSs ativas / Ticket médio / Resposta agente (verde — accent) / Aprovar (3 urgentes — warn laranja)
4. **Card "Status das OSs"** — 5 rows: dot colorido + nome + count
5. **Aprovações pendentes** — 3 cards com borda esquerda laranja
6. **Card "Últimas atividades"** — 4 rows: avatar circular colorido + texto

---

## 02 · Kanban OS ⭐
**Slug:** `admin_mobile/kanban` · **Tab ativa:** OSs

**Padrão mobile pra Kanban:** segmented control no topo, lista vertical embaixo.

### Header
Título "Ordens de serviço" + subtitle "26 OSs ativas · arraste pra mudar status" + botão FAB verde redondo `+` à direita.

### Status tabs (horizontal scroll, sticky abaixo do header)
5 pílulas, cada uma com `[dot colorido] [label] [count]`:
- Aguard. (cinza, 5)
- Aprov. (azul, 4)
- **Progresso** (laranja, 8) ← ativa padrão
- Revisão (roxa, 3)
- Concl. (verde, 6)

Ativa: bg branco (light) / surfaceElevated (dark), borda 1.5dp na cor do status, count em pill colorido. Tap troca o `activeStatus` (state local) e re-renderiza a lista.

### Lista vertical (sob a tab ativa)
Cada card:
```
[Tag categoria] #ID                       [● prioridade]
Título da OS (bold)
[avatar] Cliente
[!] Razão da escalação (se houver, faixa laranja)
[----- progress bar na cor da coluna (se em progresso) -----]
🕐 Entrega qui · 14h                              R$ 189,00
```

**Swipe horizontal num card** (gesture detector) pode mostrar ações:
swipe ← = mudar status (mostra picker), swipe → = atribuir.

---

## 03 · Atendimento (lista)
**Slug:** `admin_mobile/chat` · **Tab ativa:** Chat

### Header
Título "Atendimento" + subtitle "3 escaladas · 21 com agente" + botão de busca redondo à direita.

### Tabs
3 pílulas: Todas (24) / Humano (3) / Agente (21). Active = teal (light) / green (dark).

### Lista de conversas
Cada item (`ListTile` custom):
```
[avatar 40dp]   [Nome]                  [tempo]
[🤖 ou ! sobreposto] [última mensagem...] [badge unread]
                 [Escalada] [Urgente]    ← tags se houver
```

Avatar:
- Verde com selo 🤖 = atendido pelo agente
- Laranja com selo ! = escalada
- Vermelho/danger bg = priority high

Tap → abre conversa (próxima tela).

---

## 03b · Atendimento (conversa aberta)
**Slug:** `admin_mobile/chat/:id`

**Estrutura igual à tela de chat do cliente**, mas com role invertido e controles de admin:

### Header WhatsApp-style
- Back button
- Avatar + nome do cliente + status online + telefone
- Menu kebab à direita
- **Faixa "Contexto admin" abaixo do header** (bg verde semi-transparente):
  - Pill `🤖 AGENTE RESPONDENDO`
  - Texto "Você está observando"
  - Botão verde compacto **"Assumir"** (passa a conversa pro humano)

### Mensagens (mesmo `ChatBubble` do cliente, mas papéis invertidos)
Do ponto de vista do admin:
- `side="in"` = mensagens do **cliente** (à esquerda, branco/escuro)
- `side="out"` = mensagens da **gráfica** (à direita, verde claro/teal)
- Bolhas do agente têm header pequeno `🤖 AGENTE` em verde dark

### Eventos do sistema (SystemBubble)
Centralizadas, bg amarelo claro/teal escuro, borda dashed:
- `🤖 14:33 · agente gerou Orçamento #A-2847 · R$ 189,00`
- `📎 14:34 · cliente enviou festival-da-rua-final.pdf (2.4 MB)`

### Composer
- Placeholder muda pra **"Mensagem como atendente…"**
- Ícone `/` no lugar do emoji (sugere comandos)
- Quick replies opcionais acima do input (Pedir prazo, Enviar prova, etc.)

### Backend
```
POST /conversations/:id/messages { text, sender: "human" }
POST /conversations/:id/takeover  ← humano assume; agente para de responder
```

---

## 04 · Pedidos
**Slug:** `admin_mobile/orders` · **Tab ativa:** Pedidos

### Header + actions
"Pedidos" + "847 em 2025 · R$ 124.380 totais" + botão download redondo

### Mini KPIs (scroll horizontal)
4 cards 130dp largura: Pedidos mês / Receita mês / Ticket médio / Cancelados (warn)

### Filter pills (scroll horizontal)
Maio 2025 (active com seta dropdown), Status, Produto, Canal

### Lista de cards de pedido
Cada card:
```
[Tag categoria] #ID                     [badge status]
Título do pedido (bold)
[avatar] Cliente                          [🤖/👤 channel]
─────────────────────────────────────────────
12/05 14:34                              R$ 189,00
```

---

## 05 · Financeiro
**Slug:** `admin_mobile/finance` · **Tab ativa:** Mais (com botão back no header)

### Header
Back + "Financeiro" + "Maio 2025" + botão exportar

### Conteúdo
1. **Hero receita** dark teal: "RECEITA NO MÊS" + R$ 28.140,40 + delta + breakdown recebido/a receber
2. **Grid 2×1**: Custos mês (com breakdown) + Margem líquida (com barra de progresso)
3. **Card "Fluxo de caixa"** — bar chart agrupado 6 meses (receita verde / custos laranja) + legenda
4. **Card "Por método"** — 4 rows com barras horizontais (Pix 62%, Cartão 28%, Boleto 8%, Dinheiro 2%)
5. **Heading "Últimas transações"**
6. Cards de transação com seta ↓ verde (entrada) ou ↑ laranja (saída) + cliente + data/método + valor colorido

---

## 06 · Catálogo
**Slug:** `admin_mobile/catalog` · **Tab ativa:** Mais (back)

### Header
Back + "Catálogo" + "10 SKUs · margem média 68%" + FAB verde `+`

### Category filter (scroll horizontal)
5 pílulas com dots coloridos: Todos / Panfletos / Banners / Blocos / Apostilas

### Lista de produtos
Cada card horizontal:
```
[glyph 60×50]  [Tag categoria]              [Toggle ativo]
               Nome do produto (bold)
               SKU-CODE · prazo
               R$ preço     margem 68%      284 vendas
```

SKUs inativos: opacity 0.55

---

## 07 · Usuários
**Slug:** `admin_mobile/users` · **Tab ativa:** Mais (back)

### Header
Back + "Usuários" + "287 cadastrados · 96% no agente" + FAB verde `+`

### Segment KPIs (scroll horizontal)
5 cards 110dp: Total / VIP (roxo) / Frequentes / Novos / Inativos (warn)

### Search
Lupa + placeholder + label "Ordenar: LTV ↓" à direita

### Lista de usuários
Cada card horizontal:
```
[avatar 38dp]  Nome (bold)                [badge segment]
roxo se VIP    Empresa OU "Pessoa física"
green caso     +55 11 ...                 13 ped · R$ 2.450
contrário                                 [botão WhatsApp verde]
```

---

## 08 · Mais (Settings + outros)
**Slug:** `admin_mobile/more` · **Tab ativa:** Mais

Hub de configurações + entrada pras telas secundárias (Financeiro, Catálogo, Usuários estão dentro daqui).

```
├─ Header "Mais · Outras áreas e configurações"
├─ Profile card (dark teal): avatar D + nome + email + "● Online"
├─ Theme card (background bgElevated):
│  ├─ Row: ícone 🌙/☀️ + "Aparência" + "Atual: Claro/Escuro"
│  └─ ThemeToggleSwitch (3 opções, fullwidth)
├─ Section "ÁREAS DO PAINEL":
│  ├─ Row Financeiro (ícone gráfico azul)
│  ├─ Row Catálogo (ícone grade laranja)
│  └─ Row Usuários (ícone pessoas roxo)
├─ Section "CONFIGURAÇÕES":
│  ├─ Row Notificações
│  ├─ Row Configurações da gráfica
│  ├─ Row Permissões e equipe
│  └─ Row Central de ajuda
└─ Section "OUTROS":
   └─ Row Sair (vermelho)
```

Cada Row: ícone 36dp em cor temática + label + detail + chevron.

---

## Implementação responsiva (DRY entre desktop e mobile)

Para evitar reimplementar tudo, use um único componente por feature que decide o layout via `LayoutBuilder`:

```dart
// lib/features/admin/kanban/kanban_screen.dart
class KanbanScreen extends StatelessWidget {
  const KanbanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (ctx, constraints) {
      if (constraints.maxWidth >= 768) {
        return const _KanbanDesktop(); // 5 columns
      }
      return const _KanbanMobile(); // status tabs + vertical list
    });
  }
}
```

A camada de dados (controllers, repositórios, queries) é **a mesma**. Só o
layout visual muda. Isso garante consistência de comportamento entre as
plataformas e reduz drasticamente o código duplicado.

---

## Estados que precisam de state management

Recomendo `riverpod` ou `provider`:

- `kanbanStatusFilter` — qual status mostrar no mobile Kanban (state local da view)
- `conversationFilter` — Todas/Humano/Agente
- `themeMode` — light/dark/system (persiste em `SharedPreferences`)
- `currentTab` — tab ativo na bottom bar do admin mobile
- `pendingApprovals` — lista reativa (sync com backend), atualiza badge
- `unreadConversations` — número de conversas com mensagens novas (badge no Chat)

---

## Drag-and-drop no Kanban mobile

No mobile, drag entre colunas é difícil (não tem 5 colunas visíveis). Padrão recomendado:
1. **Long-press num card** → abre bottom sheet com 5 opções de status (lista vertical com dots coloridos)
2. Usuário toca o novo status → bottom sheet fecha → card sai da lista atual com fade-out
3. Backend `PATCH /orders/:id { status }` é chamado otimisticamente
4. Se falhar, card volta + toast vermelho

Alternativa: swipe horizontal num card mostra setas pra avançar/voltar status na linha do tempo (← Revisão | Progresso → Concluído).
