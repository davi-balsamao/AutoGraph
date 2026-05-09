# POP: Fechamento de Arquivos no Canva para Impressão

**Objetivo:** Garantir a exportação de arquivos do Canva no formato mais seguro possível para produção gráfica, contornando a limitação da plataforma de não exportar no padrão industrial nativo (**PDF/X-1a**).

---

## 1. O Ponto Nevrálgico: Canva vs. Padrão Gráfico

O Canva é uma ferramenta focada em telas (RGB). Gráficas imprimem com tinta (CMYK). Como o Canva **não exporta em PDF/X-1a** (o padrão ouro da indústria gráfica que encapsula fontes e trava as cores), precisamos emular a melhor configuração possível para que o seu material não seja rejeitado ou saia com defeitos de cor e corte.

### Comparativo de Cores: Por que seu material pode dar errado
| Sistema de Cor | Onde é usado | Características Visuais | Resultado na Impressão Física |
| :--- | :--- | :--- | :--- |
| **RGB** | Monitores, Celulares, Canva | Cores vibrantes, neon, brilhantes (formadas por luz) | **Catastrófico.** A gráfica converterá para CMYK e as cores ficarão lavadas/opacas. |
| **CMYK** | Offset, Impressão Digital | Cores opacas, sóbrias (formadas por pigmento/tinta) | **Correto.** O que você vê no arquivo CMYK é muito próximo do que será impresso. |

**AVISO SEVERO:** **Nunca espere que cores neon, azul-caneta, verde-limão ou rosa-choque criadas no Canva saiam iguais no papel.** A física da tinta não permite luz. Se você usar cores excessivamente vibrantes na tela, elas **vão morrer e ficar opacas** no produto final. 

---

## 2. Configurando a Sangria no Canva

A **sangria** é a margem de segurança externa do seu design. A guilhotina da gráfica possui uma margem de erro mecânica (geralmente de 1 a 3 milímetros). Se o fundo do seu design não "vazar" além da linha de corte, sua impressão ficará com filetes brancos indesejados nas bordas.

### Passo a Passo da Configuração
1. **Abra** o seu design no Canva.
2. No menu superior esquerdo, clique em **Arquivo**.
3. Vá em **Configurações de visualização**.
4. Clique em **Mostrar sangria de impressão**.

**A Justificativa (Por que estamos fazendo assim):** 
Ao ativar esta opção, uma linha tracejada aparecerá ao redor do limite do seu design. **Você deve esticar o fundo (cores, fotos ou texturas) até ultrapassar essa linha.** Ao mesmo tempo, elementos cruciais (textos, telefones e logos) devem ficar recuados para o centro, respeitando uma margem interna de segurança para não serem decapitados pela lâmina.

---

## 3. A Exportação: Os Cliques Exatos (À Prova de Idiotas)

Esta é a única configuração aceitável para retirar um arquivo do Canva rumo à gráfica. Qualquer desvio resultará em perda drástica de qualidade, devolução do arquivo pela pré-impressão ou prejuízo financeiro com material impresso errado.

### O Processo de Download
1. No canto superior direito, clique em **Compartilhar**.
2. No menu suspenso, clique em **Baixar**.
3. Em **Tipo de Arquivo**, altere para **PDF para Impressão** (Nunca use "PDF Padrão", PNG ou JPG).
4. **OBRIGATÓRIO:** Marque a caixa **Marcas de corte e sangria**.
5. Em **Perfil de Cor**, altere de RGB para **CMYK** *(Nota: esta função exige a assinatura do Canva Pro. Sem ela, você envia em RGB e assume o risco total da variação de cor da gráfica).*
6. Clique no botão roxo **Baixar**.

**A Justificativa (Por que estamos fazendo assim):**
- **PDF para Impressão:** Configura o arquivo para 300 DPI (alta resolução), o mínimo inegociável exigido por qualquer gráfica decente.
- **Marcas de corte e sangria:** Insere no PDF as marcas de registro (pequenas cruzes e linhas nas pontas) que o operador da guilhotina usará para alinhar a lâmina, além de incluir a margem de sangria que configuramos no passo anterior.
- **CMYK:** Força a conversão das cores de luz para o perfil de tinta, achatando os tons vibrantes ainda na tela para que o cliente tenha uma previsão realista e sem falsas expectativas antes de enviar para produção.
