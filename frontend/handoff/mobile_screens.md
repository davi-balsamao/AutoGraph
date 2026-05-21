# Mobile screens — Spec por tela (cliente)

Cada tela é um arquivo Flutter em `lib/features/customer/<slug>/`.
Mockups de referência: `Autograph App.html` no canvas (light + dark).

Tamanho de tela alvo: **360×720 dp** (iPhone 13/14 mini → padding seguro).

---

## 00a · Login
**Slug:** `auth/login`

```
SafeArea + padding 8,24,32,24
├─ Row[justify: space-between]
│  ├─ Back button (circular 36dp, surface bg)
│  └─ ThemeToggleIcon (sun/moon, 36dp)
├─ AGLogoMark size 48
├─ "Bem-vinda de volta" (heading 28/600/-0.6)
├─ Subtitle "Entre pra acompanhar seus pedidos…"
├─ Form (gap 12)
│  ├─ Field "E-mail" (label uppercase 11/600 muted + input border hairlineStrong)
│  └─ Field "Senha" (type password, trailing 👁)
├─ Row "Lembrar de mim" (checkbox verde) | "Esqueci a senha" (link verde)
├─ ElevatedButton "Entrar →" full width pill (verde)
├─ Divider "ou continue com"
├─ Row[gap 10]: SocialBtn WhatsApp | SocialBtn Google
├─ Spacer
└─ Footer: "Não tem conta? Criar conta"
```

Tudo respeita `theme(dark)` — backgrounds escuros em dark mode.

---

## 00b · Cadastro
**Slug:** `auth/signup`

```
SafeArea + padding 8,24,32,24
├─ Row[Back, ThemeToggleIcon]
├─ AGLogoMark size 40
├─ "Crie sua conta" (heading 26)
├─ Progress dots (3 segments, 2 active)
├─ Eyebrow "Passo 2 de 3 · Seus dados"
├─ Form (gap 12)
│  ├─ Field "Nome"
│  ├─ Field "E-mail"
│  ├─ Field "WhatsApp" (com leading 🇧🇷)
│  └─ Field "Senha"
├─ Password strength bar (4 segments)
├─ Checkbox "Eu li e aceito os Termos…"
├─ ElevatedButton "Criar conta →"
└─ Footer: "Já tem conta? Entrar"
```

---

## 01 · Welcome
**Slug:** `welcome` · **Background:** `AGColors.brandTealDeep` (sempre)

```
SafeArea
└─ Column (padding 40, 28, 40, 28)
   ├─ Row[justify: space-between]
   │  ├─ AGLogoMark (size 56, bg=green, stroke=tealDeep)
   │  └─ ThemeToggleIcon (40dp, bg rgba(255,255,255,0.06))
   ├─ Expanded
   │  └─ Column
   │     ├─ "Eyebrow" pill — "Gráfica + agente" (verde sobre fundo escuro)
   │     ├─ Text "Imprima tudo\nconversando." (heading2 grande, branco)
   │     └─ Text "Panfletos, banners…" (bodyMd, onDarkMuted)
   └─ Column (gap 10)
      ├─ ElevatedButton fullWidth "Começar agora →" (vai pra signup)
      ├─ OutlinedButton fullWidth "Já tenho conta" (vai pra login)
      └─ Text legal (caption centrado, muted)
```

**Animação:** Logo entra com fade+scale ao abrir.

---

## 02 · Home (Início)
**Slug:** `home` · **Bottom tab:** Início (active)

Lista vertical (`ListView`):
1. **Top bar** — `AGLogoMark` + saudação "Olá, [nome]" + ícone notificação com badge + **ThemeToggleIcon**
2. **Hero card "Agente Online"** — dark teal box, indicador verde piscante, CTA `🟢 Conversar com o agente` que abre `/chat`
3. **Section "Imprima agora"** — grid 2×2 de cards (one tap → product detail), cada card mostra `ProductGlyph` + nome + preço base
4. **Section "Último pedido"** — card horizontal: glyph 48×48 + badge "Em produção" + título + #ID + chevron → tracking
5. **Promo banner** — "🎁 10% off no primeiro pedido" em verde soft

Use `flutter_svg` pra carregar glyphs de `assets/product_*.svg`.

---

## 03 · Conversa com o agente ⭐
**Slug:** `chat` · **Background:** WhatsApp-like (`#efeae2` light / `#0b141a` dark)

Layout WhatsApp:
- **AppBar** (`AGColors.brandTealDeep`): back + `AGLogoMark` 32 + "Autograph" + selo ✓ verde + status "agente automático · responde em segundos" + ícones chamada/menu
- **Body**: `ListView` com `padding: 12, 10, 12, 70`, bg pattern (radial dots), gap 4 entre bolhas
- **Composer fixo** embaixo: emoji + input + 📎 + botão verde de enviar

### Bubble widget
```dart
class ChatBubble extends StatelessWidget {
  final bool outgoing;
  final Widget child;
  final String time;
  // outgoing: bg=#d9fdd3 (light) / #005c4b (dark), align right
  // incoming: bg=#ffffff (light) / #202c33 (dark), align left
  // radius: 10,10,2,10 (out) / 10,10,10,2 (in)
  // hora + ✓✓ azul (#53bdeb) embaixo à direita
}
```

### Cards especiais dentro de bolhas
1. **QuoteCard** — borda esquerda 3px verde, mostra orçamento #A-2847, valor grande, botões "Aprovar"/"Ajustar"
2. **ProofCard** — preview da arte em deep teal, label "PRÉ-VISUALIZAÇÃO", botões "Aprovar prova"/"Pedir ajuste"
3. **PayCard** — dois botões: "Pix · R$ 189,00" + "Cartão 6×"

### Animação (essencial!)
Sequência scriptada de 7 eventos com "typing dots" entre cada uma. Implemente como:
```dart
final script = [
  ChatEvent.outgoing("oi, queria 1000 panfletos…"),
  ChatEvent.typing(700),
  ChatEvent.incoming("Boa tarde, Mariana! 👋…"),
  // ...
];
StreamBuilder ou Future.delayed sequencial.
```

---

## 04 · Catálogo
**Slug:** `catalog` · **Bottom tab:** Catálogo

- **Top**: título "Catálogo" (heading3) + subtítulo
- **Search bar** (44dp, surfaceSoft bg, ícone lupa)
- **Pill filter row** horizontal scroll: "Tudo" (active=ink/onDark), "Promo", "24h", "Pequena tiragem", "Grande tiragem"
- **Lista vertical** de 4 cards de produto. Cada card:
  - Imagem 96×72 à esquerda (`ProductGlyph`)
  - Tag colorida (verde/laranja/roxa/azul) + título + descrição + preço a partir de + botão "Pedir" preto à direita

---

## 05 · Produto detalhe
**Slug:** `product_detail` · **Sem bottom tab** (push)

- **AppBar** transparente: ‹ + título + ♥
- **Hero image** 200dp (ProductGlyph zoom) com tag "Mais pedido" no canto
- **Título + preço** em row
- **OptionGroup** widget — chips pílula, ativo: borda 2px verde + bg surfaceFeature + texto greenDark
  - Quantidade (4 opções)
  - Formato (3 opções)
  - Papel (3 opções)
  - Cores (2 opções)
- **Upload area** dashed border + ícone + + "Enviar arte" / "Pedir diagramação"
- **Sticky bottom CTA** — botão verde "Adicionar ao pedido · R$ 189" + botão circular WhatsApp ao lado

---

## 06 · Pedidos
**Slug:** `orders` · **Bottom tab:** Pedidos

- Título "Pedidos" + subtítulo "1 em andamento · 12 concluídos"
- **Segmented control** pílula: Todos | Em andamento | Concluídos
- Lista de cards de pedido:
  - Top row: glyph 48×48 + tag de status + data + título + #ID/total
  - Se em andamento: barra de progresso + steps com bullets ("✓ Aprovado", "● Imprimindo", "○ Saiu p/ entrega", "○ Entregue")

---

## 07 · Rastreio (tracking)
**Slug:** `tracking` · **Sem bottom tab**

- AppBar com #A-2847
- **Status hero card** — dark teal: badge "EM PRODUÇÃO" + "Saindo da máquina em ~6h" (verde no número) + endereço de entrega
- **Timeline** vertical: 6 steps com checkbox circular conectados por linha:
  - ✓ Pedido recebido
  - ✓ Arte aprovada
  - ✓ Em impressão **(current — ring brilhante)**
  - ○ Acabamento
  - ○ Saiu para entrega
  - ○ Entregue
- **Resumo** card com itens + frete + total + "✓ Pago via Pix"
- **Footer** — botão "Falar com o agente" + ícone refresh

---

## 08 · Conta
**Slug:** `account` · **Bottom tab:** Conta

- Título "Conta"
- **Profile card** dark teal: avatar verde + nome + telefone + "MEMBRO DESDE MAR/2025"
- **Stats row** 3 colunas: pedidos / gasto total / avaliação
- **Sections** (heading + lista de rows):
  - Conta: Dados pessoais, Endereços, Formas de pagamento
  - Preferências:
    - **Tema** (Row com `ThemeToggleSwitch` [Claro · Escuro · Auto] inline à direita)
    - Notificações
    - Falar com humano
    - Central de ajuda
  - Outros: Sair (vermelho)
- Footer: "Autograph v1.0 · feito em São Paulo"

---

## BottomTabBar (shared)

5 abas com ícones outline (active: filled + accent). Badge no chat se houver mensagens não lidas.

```
1. Início       (home)
2. Catálogo     (shop bag)
3. Atendimento  (chat bubble) ← centro, levemente destacado
4. Pedidos      (clipboard)
5. Conta        (user)
```

Active color: `AGColors.brandTealDeep` (light) / `AGColors.brandGreen` (dark)
Inactive: `AGColors.stone`
Bar bg: `Colors.white` com 92% opacidade + blur (use `BackdropFilter`)
