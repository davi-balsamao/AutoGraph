# MANUAL RIGOROSO: FECHAMENTO DE ARQUIVO GRÁFICO

## 1. Padrão de Cor (CMYK vs RGB)

### O que é
**RGB** (Red, Green, Blue) é um sistema de cor **aditivo** baseado em emissão de luz, feito exclusivamente para monitores e telas.
**CMYK** (Cyan, Magenta, Yellow, Key/Black) é um sistema de cor **subtrativo** baseado em absorção de luz por pigmentos (tinta), sendo o único formato aceito no processo de impressão física.

### Por que a gráfica exige isso
A impressora de uma gráfica **não emite luz**, ela deposita tinta. Se você enviar um arquivo em RGB, o RIP (Raster Image Processor) da impressora realizará uma conversão automática, forçada e incontrolável para CMYK. O resultado é sempre imprevisível: cores opacas, perdas de tons neon e pretos azulados ou avermelhados. 
**A conversão deve ser feita na origem do projeto**, com o uso do perfil ICC correto (ex: *FOGRA39* ou *Coated FOGRA27*), garantindo fidelidade total entre o arquivo digital e a mídia física.

| Característica | RGB | CMYK |
| :--- | :--- | :--- |
| **Mídia Alvo** | Monitores, Web, Celulares | Papel, Lonas, Adesivos |
| **Formação** | Luz (Aditiva) | Pigmento/Tinta (Subtrativa) |
| **Gamut (Espectro)**| Amplo (Permite cores super vibrantes) | Restrito (Cores sóbrias e reais) |
| **Veredito** | **Proibido para impressão** | **Obrigatório para impressão** |

---

## 1.1 Exceção Técnica: Monocromia e Escala de Cinza em Blocos e Timbrados

### O que é
A **Escala de Cinza (Grayscale)** ou **Monocromia (Impressão 1x0 ou 1x1)** consiste em utilizar **exclusivamente o canal Preto (K)** do sistema CMYK, onde os valores são estritamente C=0, M=0, Y=0 e K variando de 0 a 100. Em papelaria de giro rápido e utilitária — especificamente **Blocos de Anotação, Receituários e Papéis Timbrados** — o projeto descarta completamente o uso de pigmentos coloridos.

### Por que a gráfica permite e recomenda esta exceção
A impressão em CMYK tradicional exige a gravação de quatro chapas offset (uma para cada cor) e quatro passadas de máquina. Para materiais de consumo em massa e uso interno, isso é um desperdício financeiro injustificável. 

*   **Otimização de Custo:** Imprimir usando apenas uma matriz de tinta (Preto) reduz o custo de produção a uma fração do valor original.
*   **Prevenção de Erro de Registro:** Blocos e timbrados são compostos primariamente por linhas finas (pautas) e tipografia pequena. Se você usar as quatro cores para formar essas linhas e a máquina desalinhar um milímetro, o texto ficará ilegível, com "sombras" coloridas (erro de registro). Usar apenas o canal K puro garante nitidez absoluta, pois apenas uma chapa carimba o papel.
*   **Sobreimpressão em Escritório:** Papéis timbrados são projetados para passar novamente por impressoras laser ou jato de tinta corporativas. Um design monocromático e limpo não compete visualmente com a tinta da impressora do escritório e não "engasga" o papel com excesso de pigmento prévio.

**Veredito Técnico:** **Nunca** utilize "Preto Rico" (mistura de Ciano, Magenta, Amarelo e Preto) para textos ou pautas de blocos e timbrados. Zere os canais C, M e Y. Aplique **exclusivamente K=100** para textos sólidos ou porcentagens menores (ex: K=30) para marcas d'água e linhas de grade.

| Característica | CMYK Completo (4x0 / 4x4) | Monocromia (Canal K Puro) |
| :--- | :--- | :--- |
| **Custo Operacional** | Alto (Exige 4 chapas offset) | **Baixo (Exige apenas 1 chapa offset)** |
| **Risco de Erro de Registro**| Crítico em linhas finas e tipografia | **Nulo (Impossível desalinhar cor única)** |
| **Nitidez de Textos Pequenos**| Risco de embaçamento | **Precisão cirúrgica** |
| **Aplicação Exclusiva** | Cartões de Visita, Folders, Embalagens | **Blocos Pautados, Receituários, Timbrados** |

---

## 2. Resolução (DPI / PPI)

### O que é
**DPI** (Dots Per Inch) e **PPI** (Pixels Per Inch) medem a densidade de informações em uma imagem raster (bitmap). Representam quantos pontos de tinta existem em cada polegada quadrada impressa. O padrão ouro para materiais impressos manuseados à curta distância (como revistas ou flyers) é de **300 DPI no tamanho final**.

### Por que a gráfica exige isso
Para garantir a nitidez. As impressoras comerciais (offset ou digitais) desenham as imagens usando retículas de meio-tom minúsculas. Se o arquivo possuir baixa densidade de pontos, essas retículas não terão dados suficientes, resultando em imagens **pixeladas, borradas e ilegíveis**.
*   **Abaixo de 300 DPI:** Risco gravíssimo de embaçamento e "serrilhado".
*   **Acima de 300 DPI (ex: 600+ DPI):** Absolutamente inútil. Gera arquivos colossais que travam os servidores da gráfica e não proporcionam nenhum ganho visível a olho nu na impressão comercial padrão.

| Resolução | Aplicação | Avaliação Técnica |
| :--- | :--- | :--- |
| **72 a 150 DPI** | Web, Banners Gigantes (vistos acima de 2m) | **Inaceitável para pequenos formatos** |
| **300 DPI** | Cartões, Flyers, Embalagens, Revistas | **Padrão Ouro (Obrigatório)** |

---

## 3. Margem de Sangria, Segurança e Linha de Corte

### O que é
É um tripé de marcações dimensionais projetado para absorver a margem de erro mecânica da guilhotina durante o acabamento (refile).
*   **Linha de Corte:** É o tamanho final absoluto do produto. Onde a lâmina deve, teoricamente, descer.
*   **Margem de Sangria:** É a extensão do fundo e das imagens que vaza além da linha de corte (geralmente **3mm a 5mm** para fora).
*   **Margem de Segurança:** É o limite interno (geralmente **3mm a 5mm** para dentro da linha de corte) que dita até onde os elementos críticos podem chegar.

### Por que a gráfica exige isso
Guilhotinas industriais cortam centenas de folhas empilhadas de uma só vez. A pressão causa atrito mecânico, fazendo com que o corte "flutue" (escorregue) alguns milímetros.
*   **Sem Sangria:** Se a lâmina escorregar para fora, um **filete branco** amador e destrutivo aparecerá nas bordas do seu impresso.
*   **Sem Margem de Segurança:** Se a lâmina escorregar para dentro, ela degolará textos, logos e informações vitais.

| Tipo de Margem | Função Crítica | Execução Obrigatória |
| :--- | :--- | :--- |
| **Sangria (+3mm)** | Evitar bordas brancas (filetes) | **Expanda fundos e fotos** até esta linha. |
| **Corte (0mm)** | Tamanho exato pretendido | Não posicione nada que termine rente a essa linha. |
| **Segurança (-3mm)** | Proteger informação vital | **Mantenha todos os textos e logos** estritamente dentro desta área. |

---

## 4. Fechamento em PDF/X-1a

### O que é
**PDF/X-1a** (ISO 15930-1) é um subconjunto rígido do formato PDF, arquitetado exclusivamente para as limitações e exigências da indústria gráfica. 

### Por que a gráfica exige isso
O PDF padrão (*High Quality Print*, *Standard*) é permissivo demais: aceita mídias interativas, espaços de cor múltiplos e camadas abertas que "quebram" os softwares de impressão (RIP). O PDF/X-1a atua como um validador de integridade inviolável:
*   **Força o CMYK/Grayscale:** Rejeita nativamente qualquer dado em RGB ou Lab.
*   **Incorpora Fontes (Embed):** Envia a tipografia original dentro do arquivo. Se a gráfica não possuir a sua fonte instalada, o texto não será substituído aleatoriamente (ex: trocar Roboto por Arial).
*   **Achata Transparências (Flattening):** Transparências, *drop shadows* e *blend modes* (sobrepor, multiplicar) causam erros severos de ripagem (blocos brancos em volta de imagens). O X-1a converte matematicamente elementos sobrepostos em áreas de cor opaca.

**Decisão Profissional:** Fechar em PDF/X-1a não é opcional nem contornável. É o limite exato entre um trabalho amador com alto risco de prejuízo e uma produção profissional blindada contra falhas técnicas.
