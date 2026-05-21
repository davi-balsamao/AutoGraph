# Admin screens — Spec por tela (gerente)

7 telas web desktop para o painel do gerente da gráfica.
Mockups de referência: `Autograph Admin.html` no canvas.

**Stack proposta:** Flutter Web responsivo a partir de 1280dp. Para tabelas grandes use `DataTable2` (package) ou implemente custom — a `DataTable` nativa é limitada.

**Layout master:** sidebar fixa 240dp à esquerda + área de conteúdo flex.

---

## 00 · Login (Desktop)
**Slug:** `admin/login`

Split-screen 50/50 ish:

### Coluna esquerda (flex)
- Background `AGColors.brandTealDeep`, color white
- Radial gradient verde sutil em 2 cantos
- Top: `AGLogo` (mark 36 + wordmark "Auto**graph**" verde)
- Eyebrow pill verde "🔒 PAINEL ADMINISTRATIVO"
- H1 grande: "A gráfica que conversa.\nO painel que executa." (heading1 44/600/-1)
- Subtitle muted, max 460dp
- **Marketing bullets** (3 itens com ícone 36dp + título + sub):
  - 🤖 Agente sempre online · Resposta média de 38s
  - 📋 Kanban arrastável · 5 colunas
  - 💸 Financeiro consolidado · Receita, custos, margem
- Footer: copyright

### Coluna direita (460dp largura, branco)
- Top right: `ThemeToggleIcon` (36dp)
- Centered vertically:
  - Eyebrow uppercase verde "ENTRAR"
  - H2 "Bem-vindo de volta" (32/600/-0.5)
  - Subtitle "Acesse o painel da gráfica"
  - Form (gap 14):
    - `DesktopField` E-mail corporativo
    - `DesktopField` Senha (com 👁 trailing)
  - Row: Checkbox "Manter conectado" | "Esqueci a senha"
  - `AdminBtn primary size=lg` full width "Entrar no painel →"
  - **2FA hint card** roxo: "🔐 Verificação em 2 etapas · vamos te pedir um código de 6 dígitos depois"
- Footer: "Não é da equipe? App do cliente"

Backend:
```
POST /auth/admin/login → { token, requires2fa: true }
POST /auth/2fa/verify { code } → token finalizado
```

---

## Shell compartilhado

### AdminSidebar (240dp, fixo, full height)
- Background: `AGColors.brandTealDeep`
- Topo: `AGLogoMark` 30dp + "Autograph" + label "PAINEL ADMIN"
- Search bar com placeholder + atalho ⌘K
- **7 itens nav** (ícone + label + badge opcional):
  1. Visão geral (Dashboard)
  2. Ordens de serviço (Kanban) · badge 12
  3. Atendimento (Chat) · badge 3
  4. Histórico de pedidos
  5. Financeiro
  6. Catálogo
  7. Usuários
- Item ativo: bg `rgba(0,237,100,.10)`, texto `brandGreen`, barra lateral verde 3dp
- Section "Acesso rápido" embaixo com 3 atalhos coloridos
- **Profile pinado no rodapé**: avatar verde + nome + status + **botão de troca de tema** (lua/sol redondo 28dp) + menu kebab

### AdminTopBar (no topo da área de conteúdo)
- Breadcrumb pequeno + título grande + subtítulo
- Ações alinhadas à direita (botões de ação principal)

---

## 01 · Dashboard (Visão geral)
**Slug:** `admin/dashboard`

Estrutura:
1. **Top bar**: "Bom dia, Davi 👋" + actions: Exportar (secondary) + Nova OS (primary)
2. **4 KPI cards** em grid 4 colunas:
   - Pedidos hoje · 24 · ↑18%
   - Receita 7 dias · R$ 12.480 · ↑9.4%
   - Ticket médio · R$ 142 · ▼2.1%
   - Tempo médio resposta · 38s · ▼12s **(accent verde — quanto menor, melhor)**
3. **Linha 2** grid 2fr/1fr:
   - **BarChart** "Pedidos × Receita" últimos 14 dias, com hoje destacado em verde + tooltip flutuante
   - **DonutChart** "OSs em andamento" com 5 segmentos coloridos + legenda
4. **Linha 3** grid 1.4fr/1fr:
   - **Atividades recentes** — lista de 5 eventos com avatar circular colorido + texto + timestamp
   - **Aprovações pendentes** — 3 cards com borda esquerda laranja + razão da escalação + botão "Revisar todas"

Gráficos: pode usar `fl_chart` ou `syncfusion_flutter_charts`.

---

## 02 · Kanban OS ⭐
**Slug:** `admin/ordens`

**5 colunas horizontais** com scroll horizontal:

| Coluna | Cor | Status backend |
|---|---|---|
| Aguardando aprovação | `AGColors.muted` | `AGUARDANDO_APROVACAO` |
| Aprovado | `AGColors.accentBlue` | `APROVADO` |
| Em progresso | `AGColors.accentOrange` | `EM_PROGRESSO` |
| Em revisão | `AGColors.accentPurple` | `EM_REVISAO` |
| Concluída | `AGColors.brandGreen` | `CONCLUIDA` |

### Coluna
- 280dp largura
- Header: dot colorido + título uppercase + counter + botão +
- Lista vertical de cards com gap 8

### Card de OS
```dart
class KanbanCard extends StatelessWidget {
  // Tag de categoria (panfleto/banner/bloco/apostila) + dot de prioridade (high/med/low)
  // Título em bold
  // Cliente (avatar 16dp + nome em cinza)
  // Se reason → faixa laranja "! Razão"
  // Se progress < 1 → barra de progresso na cor da coluna
  // Footer: #ID (mono) + valor bold
  // Deadline: "Entrega qui · 14h" com ícone relógio
}
```

### Drag and drop
Use `flutter_reorderable_grid_view` ou `flame_drag_drop`. Ao soltar em outra coluna:
```dart
PATCH /orders/{id} { "status": "EM_PROGRESSO" }
```

---

## 03 · Atendimento (Chat com clientes)
**Slug:** `admin/atendimento`

**Layout 3 colunas:**

### Coluna 1 (320dp) — Lista de conversas
- Tabs pílula: Todas (24) | Humano (3) | Agente (21)
- Lista de conversas com:
  - Avatar 38dp (vermelho se priority=high)
  - Selo 🤖 16dp verde sobreposto se atendido pelo agente
  - Nome + timestamp
  - Última mensagem truncada + badge de não-lidas
  - Tags: "Escalada" / "Urgente"
- Conversa ativa: bg `surfaceFeature` + borda esquerda 3px verde

### Coluna 2 (flex) — Conversa
- **Header**: avatar + nome + status + badge "🤖 Agente respondendo" + botão "Assumir conversa"
- **Body**: WhatsApp bg + bubbles in/out (mesmo widget do app mobile, mas em desktop)
- **Mensagens do agente**: bubble incoming com pequeno selo `🤖 AGENTE` em cima
- **Mensagens de sistema** (orçamento gerado, prova enviada): bubble cinza com borda dashed
- **Composer**: row de quick replies + textarea expansível + botão Enviar

### Coluna 3 (280dp) — Contexto do cliente
- Card cliente: avatar 48dp + nome + "Cliente desde"
- Bloco dados: telefone, email, pedidos, LTV
- Card "Conversa em curso" (dark teal) com OS atual + status + valor
- Pedidos recentes (rows pequenas)

---

## 04 · Histórico de pedidos
**Slug:** `admin/pedidos`

- **4 mini-KPIs** topo: pedidos mês, receita mês, ticket médio, taxa cancelamento (warn se >2%)
- **Barra de filtros**: search bar + pílulas (Período, Status, Produto, Canal) + botão limpar
- **DataTable** com colunas:
  - Checkbox de seleção
  - #Pedido (mono, greenDark, clicável)
  - Cliente (avatar mini + nome)
  - Produto (tag + nome)
  - Data (mono pequeno cinza)
  - Pagamento
  - Canal (🤖 Agente verde / 👤 Humano roxo)
  - Valor (bold)
  - Status (badge colorido)
  - Menu kebab
- **Paginação** rodapé: "1–10 de 847" + numerada
- Linha hover: bg `surface` muito sutil

Implementação: como `DataTable2` ou row custom com `Row` + `Expanded`.

---

## 05 · Financeiro
**Slug:** `admin/financeiro`

1. **Linha hero** grid 1.5fr/1fr/1fr:
   - Card escuro grande "Receita do mês" R$ 28.140 + delta + breakdown recebido/a receber
   - Card "Custos do mês" R$ 9.840 + breakdown insumos/logística/operacional
   - Card "Margem líquida" 65% + barra de progresso + comparativo com meta
2. **Linha 2** grid 2fr/1fr:
   - **BarChart agrupado** "Fluxo de caixa" últimos 6 meses (Receita verde, Custos laranja, lado a lado)
   - Card "Por método de pagamento" — lista com barras horizontais (Pix 62%, Cartão 28%, Boleto 8%, Dinheiro 2%)
3. **Tabela "Últimas transações"** — Data, Pedido, Cliente, Método, Tipo (↓Entrada/↑Saída), Valor (verde se entrada, laranja se saída)

---

## 06 · Catálogo
**Slug:** `admin/catalogo`

- **Filter row**: pílulas com dots coloridos (Todos / Panfletos / Banners / Blocos / Apostilas)
- Toggle visualização: lista | grade (lado direito)
- **Tabela com 10 SKUs**, colunas:
  - Produto (glyph 40×30 + nome + tag categoria)
  - SKU (mono)
  - Preço venda
  - Custo (cinza)
  - **Margem** (colorida: ≥65% verde, ≥55% laranja, <55% vermelho)
  - Pedido mínimo
  - Prazo
  - Vendas mês (número + mini sparkline horizontal verde)
  - Status (toggle ativo/inativo)
  - Menu kebab
- SKUs inativos: opacity 0.55

### Edição inline
Cada célula de preço/custo: clique → vira `TextField`. Salva on blur.

---

## 07 · Usuários
**Slug:** `admin/usuarios`

- **5 mini-KPIs** topo com dot colorido: Total / VIP / Frequentes / Novos no mês / Inativos 60d+
- **Search bar** + filtros: Segmento, Status, Ordenar
- **Tabela** colunas:
  - Cliente (avatar com bg roxo se VIP / verde caso contrário + nome + empresa abaixo)
  - Contato (telefone mono)
  - Cadastro (mês/ano)
  - Pedidos
  - LTV (bold, greenDark)
  - Último pedido
  - Segmento (badge colorido — VIP roxo, Frequente verde-soft, Regular azul, Novo laranja, Inativo cinza)
  - Status (dot colorido + label: Ativo/Novo/Inativo)
  - Ações: botão WhatsApp verde redondo + menu

---

## Cores dos status do Kanban — versão Dart

```dart
class KanbanStatus {
  static const Map<String, Color> colors = {
    'AGUARDANDO_APROVACAO': AGColors.muted,
    'APROVADO': AGColors.accentBlue,
    'EM_PROGRESSO': AGColors.accentOrange,
    'EM_REVISAO': AGColors.accentPurple,
    'CONCLUIDA': AGColors.brandGreen,
  };

  static const Map<String, String> labels = {
    'AGUARDANDO_APROVACAO': 'Aguardando aprovação',
    'APROVADO': 'Aprovado',
    'EM_PROGRESSO': 'Em progresso',
    'EM_REVISAO': 'Em revisão',
    'CONCLUIDA': 'Concluída',
  };
}
```

---

## Responsividade

Abaixo de 1024dp:
- Sidebar vira drawer (`Scaffold.drawer`)
- KPIs 4-col → 2-col
- Tabelas → scroll horizontal ou viram cards empilhados (≤640dp)
- Chat com clientes → 1 coluna por vez (lista → conversa → contexto)
- Kanban → mantém scroll horizontal (essa é a única tela que assume >1024dp pra UX boa)

Abaixo de 640dp (mobile): exibir só dashboard e métricas core. Para gerenciar OS no celular, o gerente pode usar o app mobile do cliente com flag de admin (não é parte deste handoff).
