# Image generation guide — Gemini prompts

Os SVGs em `assets/` são placeholders geométricos. Quando você gerar imagens reais com o Gemini (ou outra IA), siga esta especificação.

## Specs técnicas

| Item | Valor |
|---|---|
| Formato | PNG (preferível) ou JPG |
| Proporção | **4:3** (catálogo/listas) ou **16:9** (heros) |
| Resolução mínima | **1200×900px** (renderiza nítido em 2x retina nos cards 400×300/600×450) |
| Resolução para hero | 1920×1080px |
| Fundo | Off-white neutro (#f5f5f3) — combina com `surface` (#f9fbfa) |
| Sem | Pessoas, watermarks, textos do produto da gráfica (use lorem) |

## Prompt base (cola no Gemini antes dos específicos)

> Studio product photography, soft directional lighting from top-left, subtle drop shadow on the surface, neutral off-white background (#f5f5f3), shot from a slight angle (15-20° from front), clean and modern editorial aesthetic, no people, sharp focus on the product, high detail, professional commercial photography style, suitable for an e-commerce listing, 4:3 aspect ratio, 1200x900 resolution.

## Prompts por produto

### 1. Panfletos (`product_panfleto.png`)
> [BASE] · A stack of 8-10 printed A5 flyers, slightly fanned out so you can see the edges. The top flyer shows an abstract modern design in CMYK colors (cyan, magenta, yellow, black) with bold geometric shapes and lorem ipsum text. Glossy coated paper finish with a subtle highlight catching the light on the top edge.

### 2. Banners (`product_banner.png`)
> [BASE] · A vertical retractable banner stand, 80cm wide × 120cm tall, with a bold modern design showing big sans-serif headline in lorem ipsum, abstract geometric accents in vibrant colors, and a clear call-to-action area at the bottom. The aluminum stand base is visible at the bottom. Shown at a 3/4 angle to convey depth.

### 3. Blocos (`product_bloco.png`)
> [BASE] · Top-down view (90° overhead) of a printed notepad/order pad, A5 size, with wire-binding at the top. 50 pages, partially used — top corner of the first page is slightly folded up showing a yellow carbon-copy page underneath. Visible printed header with form fields, table grid, and "Pedido #" placeholder. Includes a wooden pencil resting diagonally next to the pad.

### 4. Apostilas (`product_apostila.png`)
> [BASE] · A printed booklet/coursebook with wire-o (twin-loop) spiral binding on the left edge. 64 pages, ~A4 size, partially open showing an inner spread with body text columns, a chart/diagram, and one image placeholder. The thick cover (visible at the back) has a modern editorial design with a single accent color band. Shown at a slight 3/4 angle.

## Onde colocar as imagens

```
frontend/
├── assets/
│   ├── svg/                     ← SVGs do logo (mantém)
│   │   ├── logo_mark.svg
│   │   └── logo_autograph.svg
│   └── products/                ← suas imagens reais (Gemini)
│       ├── panfleto.png
│       ├── banner.png
│       ├── bloco.png
│       └── apostila.png
```

No `pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/svg/
    - assets/products/
```

## Como o widget vai carregar

Crie um helper único — escolhe SVG (placeholder) ou imagem real automaticamente:

```dart
class ProductImage extends StatelessWidget {
  final String kind; // panfleto | banner | bloco | apostila
  final BoxFit fit;
  const ProductImage({super.key, required this.kind, this.fit = BoxFit.cover});

  @override
  Widget build(BuildContext context) {
    // Tenta PNG real; se não existir, cai pro SVG placeholder
    return Image.asset(
      'assets/products/$kind.png',
      fit: fit,
      errorBuilder: (_, __, ___) => SvgPicture.asset(
        'assets/svg/product_$kind.svg',
        fit: fit,
      ),
    );
  }
}
```

Assim você implementa o app HOJE com os SVGs e troca pelas fotos do Gemini quando estiver pronto — sem refatoração.

## Variações que valem gerar

Pra cada produto, gere **3 variações** (com texturas/cores diferentes) para usar em:
- Card do catálogo (1 imagem)
- Detalhe do produto (carrossel de 3 — hero + close-up + contexto)

## Dicas de prompting

1. Sempre rode o prompt 2-3 vezes — escolha a melhor
2. Se vier com texto legível ofensivo/estranho, peça "lorem ipsum placeholder text only"
3. Pra consistência de luz entre fotos: "matching lighting and white balance to existing product photos"
4. Pra dark mode (opcional, mais raro): "alternate version with darker background #1a1a1c for dark UI"
