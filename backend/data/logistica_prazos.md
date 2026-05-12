# Diretrizes Logísticas e Operacionais: Prazos, Cut-off e Refação

## 1. Conceito Base: Dinâmica de Prazos em Produção Gráfica
No negócio gráfico, o tempo de produção não começa no pagamento do pedido, mas sim na **aprovação final do arquivo para impressão**. O fluxo é medido em **Dias Úteis (D+X)**. 

Do ponto de vista estratégico, a complexidade do acabamento dita o gargalo produtivo. Misturar pedidos de corte reto com pedidos de verniz localizado na mesma esteira sem gestão de prazos destrói o **Planejamento e Controle da Produção (PCP)**.

### Matriz de Prazos vs. Complexidade de Acabamento

| Categoria do Pedido | Acabamentos Envolvidos | Prazo Padrão | Justificativa Operacional |
| :--- | :--- | :--- | :--- |
| **Básico** | Apenas corte reto, sem enobrecimento, papel couchê ou offset padrão. | **D+1** | Processo em linha reta. Imprime, guilhotina e embala. Rápida secagem. |
| **Intermediário** | Dobras, Laminação BOPP (Fosca/Brilho), Verniz Total, Furo. | **D+3** | Exige tempo de cura da película (BOPP) e setup manual em máquinas de acabamento (dobradeira/furadeira). |
| **Avançado** | **Verniz Localizado UV**, Hot Stamping, Faca Especial, Relevo. | **D+5 a D+7** | **Gargalo Alto:** Requer fabricação de matrizes terceirizadas (facas/clichês), tempo de secagem UV e múltiplos setups em máquinas diferentes. |

---

## 2. Horário de Corte (Cut-off Time): A Regra das 14h00

Para garantir a eficiência da esteira de produção e a montagem das chapas offset (imposição), a regra de corte é **innegociável**.

*   **Aprovado ATÉ as 14h00:** O arquivo é processado no mesmo dia. O prazo D+X começa a contar a partir de **hoje**.
*   **Aprovado APÓS as 14h00:** O arquivo fica retido na pré-impressão. O prazo D+X só começa a contar a partir do **próximo dia útil**.

**Visão de Negócios (Por que não flexibilizar?):** 
Abrir exceções no horário de corte força a quebra de chapas otimizadas. Se o operador de pré-impressão precisar refazer o fechamento de uma chapa às 16h para encaixar um "cliente parceiro", a gráfica perde produtividade e atrasa pedidos que cumpriram a regra. **A regra protege a margem de lucro.**

---

## 3. Política de Refação e Garantia: Matriz de Responsabilidades

O princípio central da gráfica é: **A máquina errou, a gráfica paga. O arquivo veio errado, o cliente paga.** Não fique "em cima do muro". Assuma a responsabilidade técnica e exija do cliente a responsabilidade sobre o conteúdo.

### Tabela de Responsabilidades e Refação

| Categoria do Erro | De quem é a culpa? | Exemplos Práticos do Erro | Ação de Resolução |
| :--- | :--- | :--- | :--- |
| **Erro de Processo/Máquina** | **Gráfica** | Manchas de tinta na folha; Variação de cor superior a 10% (padrão CMYK); Corte torto invadindo a arte; Laminação com bolhas ou descascando. | **Refação 100% gratuita** com prioridade máxima na esteira de produção (D+1). |
| **Erro de Conteúdo/Arquivo** | **Cliente** | Erro de digitação (telefone errado, erro de português); Arquivo enviado em **RGB** (causando variação drástica e cores opacas na impressão); Imagem pixelada (< 300 DPI); Arte enviada sem margem de sangria. | **Sem refação gratuita.** O cliente deve corrigir a arte e arcar com um **novo orçamento integral**. |

### Aprofundamento Prático (Como implementar)
1.  **Aprovação Blindada:** O sistema (ou o e-mail) de aprovação deve ter um *disclaimer* explícito onde o cliente concorda que revisou a ortografia e entende que cores na tela (RGB) diferem do papel (CMYK).
2.  **Tolerância de Corte:** Deixe claro que a guilhotina possui uma tolerância mecânica de 1 a 2mm. É por isso que a margem de segurança na arte existe. Reclamações de "desalinhamento" dentro dessa tolerância **não justificam refação**.
