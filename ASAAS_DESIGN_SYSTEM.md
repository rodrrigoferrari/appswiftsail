# Asaas Fintech Design System — Guia de Especificação & Tokens

Documento de extração oficial do Design System extraído da interface Web do **Asaas Dashboard** (https://www.asaas.com/dashboard/home).

---

## 1. Princípios de Design

1. **Clareza e Precisão Financeira**: Foco total nos números e no fluxo de caixa líquido. Hierarquia clara entre o valor bruto, valor líquido e contagem de clientes/cobranças.
2. **Minimalismo e Alta Legibilidade**: Fundo neutro suave (`#F8FAFC`), cartões brancos puros (`#FFFFFF`) com bordas finas de 1px (`#E2E8F0`), sem ruído visual.
3. **Azul Elétrico Como Cor de Ação e Confiança**: O azul Asaas (`#0050FF`) é o condutor de todas as ações primárias, seleções ativas e links de destaque.
4. **Curvas Suaves e Modernas**: Bordas arredondadas generosas (`rounded-2xl` / 16px para contêineres e cartões; `rounded-full` / pílulas para tags, filtros e botões de ação).

---

## 2. Paleta de Cores (Design Tokens)

### Cores Principais e de Marca
| Token | Cor Hex | Uso |
|---|---|---|
| `--asaas-blue-primary` | `#0050FF` | Botões primários, dia selecionado no calendário, item ativo do menu, links principais |
| `--asaas-blue-hover` | `#0040D6` | Hover em botões primários |
| `--asaas-blue-active` | `#0030B8` | Estado ativo / clique |
| `--asaas-blue-subtle` | `#EFF4FF` | Fundo de badges azuis, hover sutil de itens de menu |
| `--asaas-blue-border` | `#BFDBFE` | Bordas de foco e componentes selecionados |

### Cores de Superfície e Fundo
| Token | Cor Hex | Uso |
|---|---|---|
| `--asaas-bg-canvas` | `#F8FAFC` | Fundo geral da aplicação (tela / viewport) |
| `--asaas-bg-surface` | `#FFFFFF` | Cartões, modais, dropdowns, inputs e sidebar |
| `--asaas-border` | `#E2E8F0` | Linhas divisórias e contornos de cartões (1px sólido) |
| `--asaas-border-subtle` | `#F1F5F9` | Divisores internos de listas e tabelas |

### Cores Tipográficas
| Token | Cor Hex | Uso |
|---|---|---|
| `--asaas-text-title` | `#0F172A` | Títulos de seções, valores em destaque, nomes de clientes |
| `--asaas-text-body` | `#334155` | Textos corridos, labels principais |
| `--asaas-text-muted` | `#64748B` | Subtítulos ("líquido", descrições secundárias) |
| `--asaas-text-subtle` | `#94A3B8` | Placeholders, setas desabilitadas, ícones neutros |

### Cores de Status e Fluxo Financeiro
| Status | Cor Hex | Indicador | Significado |
|---|---|---|---|
| **Recebidas** | `#10B981` (Verde Esmeralda) | Ponto/Badge Verde | Cobranças liquidadas e creditadas na conta |
| **Confirmadas** | `#0284C7` (Azul Céu) | Ponto/Badge Azul | Cobranças pagas aguardando prazo de compensação |
| **Aguardando** | `#F59E0B` (Âmbar/Laranja) | Ponto/Badge Âmbar | Cobranças emitidas dentro do prazo de vencimento |
| **Vencidas** | `#EF4444` (Vermelho) | Ponto/Badge Vermelho | Cobranças que ultrapassaram a data limite |

---

## 3. Tipografia

- **Família Tipográfica**: `Inter, system-ui, -apple-system, sans-serif`
- **Hierarquia de Texto**:
  - **Saudação / Título de Página**: `text-xl md:text-2xl font-bold text-[#0F172A]`
  - **Título de Seção**: `text-base font-bold text-[#0F172A]`
  - **Valores Financeiros (KPI)**: `text-2xl md:text-[26px] font-bold text-[#0F172A] tracking-tight`
  - **Subtítulo Líquido**: `text-xs text-[#64748B] font-normal`
  - **Links de Drilldown**: `text-xs font-semibold text-[#475569] hover:text-[#0050FF]`
  - **Labels e Legendas**: `text-[11px] md:text-xs text-[#64748B]`

---

## 4. Estrutura de Componentes

### 1. Barra de Ação Superior
- Saudação: `"Olá, [Nome da Empresa / Cliente]"`
- Ação Principal: Botão pílula azul (`bg-[#0050FF] hover:bg-[#0040D6] text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2`) com o texto `"Criar cobrança"` e ícone de seta/chevron.

### 2. Seção "Situação das cobranças"
- Cabeçalho com controles:
  - Título `"Situação das cobranças"`
  - Switch pill toggle `"Versão gráfico"` para alternar entre visão de Cartões KPI e Gráfico comparativo
  - Filtro de período em pílula com chevron: `"Este mês ▾"`
  - Filtro secundário: `"Filtros ▾"`
- Grade horizontal com 4 cartões de status:
  - **Recebidas** | **Confirmadas** | **Aguardando** | **Vencidas**
  - Cada cartão contém:
    - Indicador de status com ícone de informação tooltip `(i)`
    - Valor principal em negrito destacado
    - Valor líquido formatado
    - 2 links no rodapé com setas de navegação:
      - `👥 X clientes >`
      - `📄 Y cobranças >`

### 3. Seção "Calendário de recebimento"
- Subtítulo explicativo:
  *"Acompanhe as cobranças recebidas e a previsão de repasse das cobranças que estão aguardando o prazo de compensação."*
- Legenda com pílulas e pontos coloridos:
  - `🟢 Recebidas`
  - `🔵 Confirmadas`
- Navegador de mês com controles `< Outubro 2026 >`
- Matriz 7x5 com dias da semana (`Dom Seg Ter Qua Qui Sex Sáb`)
- Dia atual em destaque com círculo azul (`w-8 h-8 rounded-full border-2 border-[#0050FF] text-[#0050FF]`)
- Indicadores pontuais sob cada dia que possui previsão de entrada
- Card de detalhamento do dia selecionado:
  - Cabeçalho com data (`📅 09/10/2026`) e link `"Extrato >"`
  - Linhas com ícone de verificação verde: `"Cobranças recebidas: R$ X.XXX,XX >"`

### 4. Seção "Benefícios"
- Card clean com carrossel:
  - Título `"Benefícios"`
  - Subcard `"Cobranças grátis"` com ícone de cifrão `$`
  - Mensagem `"Nenhuma cobrança grátis disponível"` e link de ajuda `"O que são cobranças grátis?"`
  - Navegação carrossel `< • • >`

### 5. Seção "Para você"
- Banners promocionais com imagem ilustrativa, tipografia moderna e botão de ação:
  - `"Use seu celular como maquininha (Asaas Tap)"`
  - `"Voe mais alto com o Plano Avançado"`
  - Controles de paginação `< • • • >`

### 6. Widget de Ajuda Rápida
- Botão/chip no rodapé `"Posso ajudar?"` com ícone de suporte flutuante.
