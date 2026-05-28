# IARA Web — Design System
> Plataforma de Comando e Controle para Gestores e Administradores da Defesa Civil.
> Este documento é a referência canônica de identidade visual, componentes e padrões
> do frontend web React do sistema IARA.
>
> **Público-alvo da interface:** GESTOR, ADMIN, MONITOR — usuários da Defesa Civil
> operando em desktops e notebooks em centros de operação ou em campo com computadores.
> Diferente do mobile (voluntários, técnicos, doadores), o web é focado em
> **consciência situacional, análise e tomada de decisão**.

---

## Princípios de Design

1. **Clareza operacional primeiro** — em momentos de desastre, cada segundo conta. Informação crítica deve ser visível sem scroll, sem ambiguidade.
2. **Hierarquia visual de severidade** — o olho do operador deve ser guiado automaticamente para o que é mais urgente na tela.
3. **Densidade informacional controlada** — dashboards densos são necessários, mas não podem ser caóticos. Agrupamento, espaçamento e cor comunicam estrutura.
4. **Dark mode institucional** — interface escura reduz fadiga visual em ambientes de operação prolongada e dá contraste nítido para dados críticos.
5. **Estados sempre visíveis** — loading, erro, vazio e sucesso precisam ser comunicados explicitamente. Nunca deixar o operador sem feedback.

---

## 1. Paleta de Cores

### 1.1 Cores Base — Backgrounds

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-app` | `#070B14` | Background raiz da aplicação |
| `--bg-primary` | `#0C1220` | Background de painéis principais e sidebar |
| `--bg-secondary` | `#111827` | Cards, seções, surface padrão |
| `--bg-elevated` | `#1A2332` | Cards elevados, dropdowns, modais |
| `--bg-overlay` | `rgba(7, 11, 20, 0.85)` | Overlay de modais e drawers |
| `--bg-hover` | `rgba(255, 255, 255, 0.04)` | Hover em itens de lista e nav |
| `--bg-active` | `rgba(15, 71, 188, 0.12)` | Item ativo de navegação |

### 1.2 Cores de Marca (Brand)

O logo IARA representa **sol + ondas**: metade superior com gradiente laranja/âmbar (arco solar), metade inferior com ondas azuis. A paleta de marca reflete ambas as metades.

#### Família Azul (ondas — identidade principal)

| Token | Valor | Uso |
|-------|-------|-----|
| `--brand-blue-dark` | `#0F47BC` | Cor primária — CTAs, destaques |
| `--brand-blue-medium` | `#0D439A` | Hover de botões primários |
| `--brand-blue-light` | `#3B82F6` | Links, ícones, indicadores |
| `--brand-blue-soft` | `rgba(15, 71, 188, 0.15)` | Background sutil |
| `--brand-blue-glow` | `rgba(15, 71, 188, 0.3)` | Glow/focus |
| `--brand-white` | `#FEFEFE` | Texto sobre fundos escuros/azuis |

#### Família Laranja/Âmbar (sol — acento e identidade visual)

Derivados diretamente do gradiente do arco solar no logo:

| Token | Valor | Tailwind | Uso |
|-------|-------|----------|-----|
| `--brand-orange` | `#E8621A` | `brand-orange` | Laranja quente — badge DC, accents de campo |
| `--brand-amber` | `#F5A623` | `brand-amber` | Âmbar/dourado — ponto mais claro do gradiente solar |
| `--brand-orange-soft` | `rgba(232, 98, 26, 0.15)` | — | Background sutil em elementos orange |
| `--brand-orange-glow` | `rgba(232, 98, 26, 0.3)` | — | Glow em hover orange |

**Onde usar laranja/âmbar:**
- Badge "DC" na topbar (acento do logo)
- Linha de acento na borda inferior da topbar (gradiente azul→laranja→âmbar)
- `.gradient-text-brand` — gradiente de texto da marca (âmbar→laranja→azul)
- `.gradient-text-solar` — gradiente somente solar (âmbar→laranja), para títulos especiais

```css
/* Gradiente completo da marca — reflete o logo */
.gradient-text-brand {
  background: linear-gradient(135deg, #F5A623 0%, #E8621A 40%, #0F47BC 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Só solar — para accents de campo/operações */
.gradient-text-solar {
  background: linear-gradient(135deg, #F5A623 0%, #E8621A 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### 1.3 Cores de Texto

| Token | Valor | Uso |
|-------|-------|-----|
| `--text-primary` | `#F0F4F8` | Títulos, labels principais |
| `--text-secondary` | `#94A3B8` | Descrições, subtítulos |
| `--text-muted` | `#64748B` | Timestamps, metadados, placeholders |
| `--text-disabled` | `rgba(148, 163, 184, 0.4)` | Campos e ações desabilitados |
| `--text-inverse` | `#FEFEFE` | Texto sobre backgrounds azuis/escuros |

### 1.4 Cores de Severidade / Estado Operacional

Crítico para o IARA: **o operador precisa identificar o nível de urgência instantaneamente.**

| Token | Valor | Nome | Uso |
|-------|-------|------|-----|
| `--severity-critica` | `#EF4444` | Vermelho — Crítico | Eventos CRITICA, alertas iminentes, START vermelho |
| `--severity-critica-bg` | `rgba(239, 68, 68, 0.12)` | | Background de cards de severidade crítica |
| `--severity-critica-border` | `rgba(239, 68, 68, 0.35)` | | Bordas de elementos críticos |
| `--severity-alta` | `#F97316` | Laranja — Alta | Eventos ALTA, avisos urgentes |
| `--severity-alta-bg` | `rgba(249, 115, 22, 0.12)` | | |
| `--severity-alta-border` | `rgba(249, 115, 22, 0.35)` | | |
| `--severity-media` | `#EAB308` | Amarelo — Média | Eventos MEDIA, atenção |
| `--severity-media-bg` | `rgba(234, 179, 8, 0.12)` | | |
| `--severity-media-border` | `rgba(234, 179, 8, 0.35)` | | |
| `--severity-baixa` | `#22C55E` | Verde — Baixa | Eventos BAIXA, status OK |
| `--severity-baixa-bg` | `rgba(34, 197, 94, 0.12)` | | |
| `--severity-baixa-border` | `rgba(34, 197, 94, 0.35)` | | |

### 1.5 Cores de Status do Sistema

| Token | Valor | Uso |
|-------|-------|-----|
| `--status-success` | `#22C55E` | Confirmações, ações bem-sucedidas |
| `--status-success-bg` | `rgba(34, 197, 94, 0.1)` | |
| `--status-warning` | `#EAB308` | Alertas não críticos, itens pendentes |
| `--status-warning-bg` | `rgba(234, 179, 8, 0.1)` | |
| `--status-danger` | `#EF4444` | Erros, falhas, ações destrutivas |
| `--status-danger-bg` | `rgba(239, 68, 68, 0.1)` | |
| `--status-info` | `#3B82F6` | Informações neutras, dicas |
| `--status-info-bg` | `rgba(59, 130, 246, 0.1)` | |
| `--status-offline` | `#64748B` | Recursos offline, desativados |

### 1.6 Cores do Protocolo START

Usadas exclusivamente em dashboards de triagem médica:

| Token | Valor | Classificação START | Uso |
|-------|-------|---------------------|-----|
| `--start-vermelho` | `#EF4444` | Crítico/Imediato | Risco de vida |
| `--start-amarelo` | `#EAB308` | Urgente/Observação | Estável, pode deteriorar |
| `--start-verde` | `#22C55E` | Leve/Ambulante | Ferimentos menores |
| `--start-preto` | `#374151` | Óbito/Expectante | |
| `--start-preto-text` | `#9CA3AF` | | Texto sobre preto |

### 1.7 Bordas

| Token | Valor | Uso |
|-------|-------|-----|
| `--border-subtle` | `rgba(255, 255, 255, 0.05)` | Separadores quase invisíveis |
| `--border-default` | `rgba(255, 255, 255, 0.1)` | Bordas padrão de cards e inputs |
| `--border-strong` | `rgba(255, 255, 255, 0.18)` | Bordas de elementos em destaque |
| `--border-brand` | `rgba(15, 71, 188, 0.4)` | Bordas de elementos ativos/focados |
| `--border-focus` | `#0F47BC` | Borda de input em foco |

---

## 2. Tipografia

### 2.1 Fontes

| Fonte | Uso | Import |
|-------|-----|--------|
| **Inter** | Fonte principal — corpo, labels, dados, UI em geral | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800')` |
| **JetBrains Mono** | Dados numéricos, coordenadas, códigos COBRADE, IDs | `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600')` |

**Stack completo:**
```css
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

> **Justificativa Inter:** Fonte amplamente adotada em produtos institucionais e de dados (Linear, Vercel, Notion). Alta legibilidade em tamanhos pequenos, excelente rendering em Windows. **JetBrains Mono** para coordenadas e códigos — distingue 0/O, 1/l/I e comunica que aquele dado é técnico/preciso.

### 2.2 Escala Tipográfica

| Token | Tamanho | Peso | Line Height | Uso |
|-------|---------|------|-------------|-----|
| `--text-2xs` | `10px` | `500` | `1.4` | Eyebrows, timestamps, labels de badge |
| `--text-xs` | `11px` | `400–500` | `1.4` | Metadados, subtextos de tabela |
| `--text-sm` | `12px` | `400–500` | `1.5` | Corpo secundário, labels de input, tooltips |
| `--text-base` | `14px` | `400–500` | `1.6` | Corpo principal, itens de lista |
| `--text-md` | `15px` | `500–600` | `1.5` | Labels importantes, subtítulos de seção |
| `--text-lg` | `18px` | `600` | `1.4` | Títulos de card, headers de seção |
| `--text-xl` | `22px` | `700` | `1.3` | Títulos de página |
| `--text-2xl` | `28px` | `700–800` | `1.2` | Números grandes de KPI/stat |
| `--text-3xl` | `36px` | `800` | `1.1` | Números hero em dashboards críticos |

### 2.3 Padrões de Texto Específicos do IARA

```css
/* Eyebrow de seção — acima de títulos */
.eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Números de KPI — dados em destaque */
.kpi-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

/* Dado técnico — coordenadas, COBRADEs, códigos */
.data-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--brand-blue-light);
}

/* Label de severidade — curto, em caps */
.severity-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

---

## 3. Layout e Grid

### 3.1 Estrutura Geral da Aplicação

```
┌─────────────────────────────────────────────────────┐
│  TOPBAR (altura: 56px, fixa)                        │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   SIDEBAR    │         MAIN CONTENT                 │
│  (240px,     │  (flex-1, scroll vertical)           │
│   fixa)      │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Para a tela de Mapa (fullscreen):**
```
┌─────────────────────────────────────────────────────┐
│  TOPBAR (56px, transparente sobre o mapa)           │
├──────────────┬──────────────────────────────────────┤
│   SIDEBAR    │                                      │
│  (colapsável)│        MAPA FULLSCREEN               │
│              │     (100% da área restante)          │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
       ↕ Painel lateral flutuante sobre o mapa
```

### 3.2 Dimensões Fixas

| Elemento | Valor |
|----------|-------|
| Topbar height | `56px` |
| Sidebar width (expandida) | `240px` |
| Sidebar width (colapsada) | `64px` |
| Sidebar transition | `200ms ease` |
| Content max-width | `1440px` |
| Content padding horizontal | `24px` |
| Content padding vertical | `24px` |

### 3.3 Grid de Conteúdo

Usar CSS Grid de 12 colunas no main content:

```css
.content-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}
```

**Ocupação padrão por tipo de componente:**

| Componente | Colunas |
|------------|---------|
| Stat card (KPI) | 3 colunas (4 cards por linha) |
| Card médio | 4 colunas |
| Card largo | 6 colunas |
| Card full | 12 colunas |
| Tabela | 12 colunas |
| Mapa | 8 colunas + 4 de painel lateral |

### 3.4 Breakpoints

| Nome | Largura | Adaptação |
|------|---------|-----------|
| `lg` | `1024px` | Sidebar colapsada por padrão |
| `xl` | `1280px` | Layout padrão |
| `2xl` | `1536px` | Grid mais denso, mais colunas visíveis |
| `3xl` | `1920px` | Fonte base sobe para 15px |

---

## 4. Espaçamento

### 4.1 Escala de Espaçamento

| Token | Valor | Uso típico |
|-------|-------|------------|
| `--space-1` | `4px` | Gap mínimo, padding de badges |
| `--space-2` | `8px` | Padding interno de chips, gap entre ícone e label |
| `--space-3` | `12px` | Padding de botões, gap entre elementos de form |
| `--space-4` | `16px` | Padding de cards, gap de grid |
| `--space-5` | `20px` | Padding de seções internas |
| `--space-6` | `24px` | Padding de página, gap entre cards |
| `--space-8` | `32px` | Espaçamento entre seções |
| `--space-12` | `48px` | Separação de blocos maiores |

### 4.2 Padding Padrão por Componente

| Componente | Padding |
|------------|---------|
| Topbar | `0 24px` |
| Sidebar item | `8px 12px` |
| Card | `20px` |
| Stat card | `16px 20px` |
| Modal | `24px` |
| Drawer | `24px` |
| Table cell | `12px 16px` |
| Input | `10px 12px` |
| Botão primário | `10px 20px` |
| Botão secundário | `9px 16px` |
| Badge | `3px 8px` |

---

## 5. Border Radius

| Valor | Token | Uso |
|-------|-------|-----|
| `4px` | `--radius-sm` | Badges, chips, tags |
| `6px` | `--radius-md` | Botões, inputs, tooltips |
| `8px` | `--radius-lg` | Cards padrão |
| `12px` | `--radius-xl` | Cards em destaque, modais |
| `16px` | `--radius-2xl` | Painéis principais, drawers |
| `50%` | `--radius-full` | Avatares, indicadores circulares, pulse dots |

---

## 6. Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Cards básicos |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)` | Cards elevados, dropdowns |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)` | Modais, drawers |
| `--shadow-brand` | `0 0 0 1px rgba(15,71,188,0.4), 0 4px 16px rgba(15,71,188,0.2)` | Focus ring de input, elemento ativo brand |
| `--shadow-critica` | `0 0 0 1px rgba(239,68,68,0.4), 0 4px 16px rgba(239,68,68,0.2)` | Cards de evento crítico em destaque |
| `--shadow-inner` | `inset 0 1px 0 rgba(255,255,255,0.05)` | Profundidade interna em cards |

---

## 7. Gradientes

### 7.1 Gradientes de Background

```css
/* Background principal da sidebar */
--gradient-sidebar: linear-gradient(180deg, #0C1220 0%, #070B14 100%);

/* Topbar com leve gradiente horizontal */
--gradient-topbar: linear-gradient(90deg, #0C1220 0%, #0F1520 100%);

/* Card de evento crítico — borda de atenção */
--gradient-critica: linear-gradient(135deg,
  rgba(239, 68, 68, 0.15) 0%,
  rgba(239, 68, 68, 0.05) 100%);

/* Card brand ativo */
--gradient-brand: linear-gradient(135deg,
  rgba(15, 71, 188, 0.2) 0%,
  rgba(15, 71, 188, 0.06) 100%);

/* Linha divisória em gradiente (horizontal) */
--gradient-divider-h: linear-gradient(90deg,
  transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);

/* Linha divisória em gradiente (vertical, sidebar) */
--gradient-divider-v: linear-gradient(180deg,
  transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
```

### 7.2 Gradientes de Texto

```css
/* Logo e marca IARA */
.gradient-text-brand {
  background: linear-gradient(135deg, #3B82F6 0%, #0F47BC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* KPI crítico em destaque */
.gradient-text-critica {
  background: linear-gradient(135deg, #EF4444 0%, #F97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 7.3 Barra Indicadora de Severidade (topo de card)

```css
/* Aplicar como ::before no card ou como elemento filho */
.severity-bar-critica::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #EF4444 40%, #EF4444 60%, transparent 100%);
}
.severity-bar-alta::before { /* idêntico com #F97316 */ }
.severity-bar-media::before { /* idêntico com #EAB308 */ }
.severity-bar-baixa::before { /* idêntico com #22C55E */ }
```

---

## 8. Animações e Transições

### 8.1 Durações

| Duração | Uso |
|---------|-----|
| `100ms` | Hover de botões, mudança de cor |
| `150ms` | Hover de itens de lista e nav |
| `200ms` | Sidebar collapse/expand, fade de dropdown |
| `250ms` | Transições de card, hover elevation |
| `300ms` | Modais e drawers (entrada e saída) |
| `400ms` | Animações de página completa |

### 8.2 Easing

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);  /* Material standard */
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* bounce leve */
```

### 8.3 Keyframes

```css
/* Fade in suave — entrada de cards e modais */
@keyframes iara-fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide in lateral — drawers e painéis */
@keyframes iara-slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Pulse de alerta — elementos críticos ativos */
@keyframes iara-pulse-critica {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  50%      { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2); }
}

/* Pulse dot — status online */
@keyframes iara-pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
  50%      { opacity: 0.6; box-shadow: 0 0 2px currentColor; }
}

/* Spin — loading */
@keyframes iara-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Shimmer — skeleton loading */
@keyframes iara-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 9. Componentes

### 9.1 Topbar

```tsx
// Altura fixa de 56px, background sólido, z-index: 50
// Conteúdo: logo + nome IARA | breadcrumb da rota | ações do usuário

<header className="
  fixed top-0 left-0 right-0 h-14 z-50
  bg-[#0C1220] border-b border-white/5
  flex items-center px-6 gap-4
">
  {/* Logo + nome */}
  <div className="flex items-center gap-2.5 w-[240px] flex-shrink-0">
    <img src="/logo-iara.svg" alt="IARA" className="h-7 w-auto" />
    <span className="text-[15px] font-bold text-white tracking-tight">IARA</span>
    <span className="text-[10px] font-semibold text-[#3B82F6] uppercase tracking-widest
                     bg-[rgba(15,71,188,0.15)] border border-[rgba(15,71,188,0.3)]
                     px-2 py-0.5 rounded ml-1">
      DC
    </span>
  </div>

  {/* Breadcrumb */}
  <nav className="flex-1 flex items-center gap-1 text-sm text-[#64748B]">
    <span>Dashboard</span>
    <span>/</span>
    <span className="text-[#F0F4F8]">Eventos Ativos</span>
  </nav>

  {/* Ações */}
  <div className="flex items-center gap-3">
    {/* Badge de tenant */}
    <span className="text-[11px] font-medium text-[#94A3B8] bg-white/5 px-3 py-1 rounded-full">
      DC Taubaté
    </span>
    {/* Sino de notificações */}
    <button className="relative w-9 h-9 flex items-center justify-center
                       rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5
                       transition-colors">
      <BellIcon size={18} />
      {/* Badge de não lidas */}
      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
    </button>
    {/* Avatar do usuário */}
    <button className="w-8 h-8 rounded-full bg-[#0F47BC] flex items-center justify-center
                       text-white text-[12px] font-bold hover:ring-2 hover:ring-[#0F47BC]/50
                       transition-all">
      GS
    </button>
  </div>
</header>
```

### 9.2 Sidebar

```tsx
// Largura: 240px expandida / 64px colapsada
// Fixo à esquerda, abaixo da topbar

<aside className="
  fixed left-0 top-14 bottom-0 z-40
  w-60 bg-gradient-to-b from-[#0C1220] to-[#070B14]
  border-r border-white/5
  flex flex-col
  transition-all duration-200
">
  {/* Eyebrow de seção */}
  <div className="px-3 pt-5 pb-2
                  text-[10px] font-semibold text-[#64748B]
                  uppercase tracking-[0.12em]">
    Operações
  </div>

  {/* Item de navegação */}
  <NavItem href="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
  <NavItem href="/eventos"   icon={<AlertTriangle size={16} />}   label="Eventos"
           badge="3" badgeVariant="critica" />
  <NavItem href="/mapa"      icon={<Map size={16} />}             label="Mapa" />

  {/* Separador */}
  <div className="mx-3 my-2 h-px bg-gradient-to-r
                  from-transparent via-white/8 to-transparent" />

  {/* Grupo — Infraestrutura */}
  <div className="px-3 pt-3 pb-2
                  text-[10px] font-semibold text-[#64748B]
                  uppercase tracking-[0.12em]">
    Infraestrutura
  </div>

  <NavItem href="/pcs"       icon={<Package size={16} />}         label="Pontos de Coleta" />
  <NavItem href="/abrigos"   icon={<Home size={16} />}            label="Abrigos" />
  <NavItem href="/hospitais" icon={<Cross size={16} />}           label="Hospitais" />

  {/* Footer da sidebar — versão */}
  <div className="mt-auto p-3 border-t border-white/5
                  text-[10px] text-[#64748B] text-center">
    IARA v1.0 · DC Taubaté
  </div>
</aside>

{/* NavItem component */}
const NavItem = ({ href, icon, label, badge, badgeVariant, isActive }) => (
  <a href={href} className={`
    group relative mx-2 flex items-center gap-2.5 px-2.5 py-2 rounded-lg
    text-[13px] font-medium transition-all duration-150
    ${isActive
      ? 'bg-[rgba(15,71,188,0.15)] text-white border border-[rgba(15,71,188,0.3)]'
      : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04] border border-transparent'
    }
  `}>
    {/* Barra vertical de ativo */}
    {isActive && (
      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full
                       bg-[#0F47BC]
                       shadow-[0_0_8px_rgba(15,71,188,0.7)]" />
    )}
    <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-[#3B82F6]' : 'group-hover:text-[#94A3B8]'}`}>
      {icon}
    </span>
    <span className="truncate">{label}</span>
    {badge && (
      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded
        ${badgeVariant === 'critica' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : ''}
        ${badgeVariant === 'brand'   ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : ''}
      `}>
        {badge}
      </span>
    )}
  </a>
);
```

### 9.3 Stat Card (KPI)

Card de métrica para dashboards. Ocupa 3 colunas no grid de 12.

```tsx
// Variantes: default | critica | alta | media | baixa | brand

<div className={`
  relative overflow-hidden rounded-xl p-5
  bg-[#111827] border transition-all duration-250
  hover:-translate-y-0.5 hover:shadow-lg
  ${variant === 'critica' ? 'border-red-500/25 hover:border-red-500/40 hover:shadow-red-500/10' : ''}
  ${variant === 'default' ? 'border-white/8 hover:border-white/14' : ''}
`}>
  {/* Barra de severidade no topo */}
  <div className={`absolute top-0 left-0 right-0 h-[2px]
    ${variant === 'critica' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : ''}
    ${variant === 'alta'    ? 'bg-gradient-to-r from-transparent via-orange-500 to-transparent' : ''}
    ${variant === 'media'   ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' : ''}
    ${variant === 'baixa'   ? 'bg-gradient-to-r from-transparent via-green-500 to-transparent' : ''}
    ${variant === 'brand'   ? 'bg-gradient-to-r from-transparent via-blue-500 to-transparent' : ''}
  `} />

  {/* Conteúdo */}
  <div className="flex items-start justify-between mb-3">
    {/* Eyebrow + Título */}
    <div>
      <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.1em] mb-0.5">
        {eyebrow}
      </p>
      <p className="text-[13px] font-medium text-[#94A3B8]">{title}</p>
    </div>
    {/* Ícone */}
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
      ${variant === 'critica' ? 'bg-red-500/10 text-red-400' : ''}
      ${variant === 'brand'   ? 'bg-blue-500/10 text-blue-400' : ''}
      ${variant === 'default' ? 'bg-white/5 text-[#94A3B8]' : ''}
    `}>
      {icon}
    </div>
  </div>

  {/* Valor principal */}
  <p className={`text-[28px] font-bold leading-none tabular-nums mb-1.5
    ${variant === 'critica' ? 'text-red-400' : ''}
    ${variant === 'brand'   ? 'text-white' : ''}
    ${variant === 'default' ? 'text-[#F0F4F8]' : ''}
  `}>
    {value}
  </p>

  {/* Delta / variação */}
  {delta && (
    <p className={`text-[12px] font-medium flex items-center gap-1
      ${delta > 0 ? 'text-red-400' : 'text-green-400'}
    `}>
      {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(delta)}% em relação ao último evento
    </p>
  )}
</div>
```

### 9.4 Card de Evento

Card completo para listagem de eventos na página de eventos e no dashboard.

```tsx
<div className={`
  relative overflow-hidden rounded-xl
  bg-[#111827] border cursor-pointer
  transition-all duration-200 group
  hover:-translate-y-0.5
  ${severity === 'CRITICA' ? 'border-red-500/25 hover:border-red-500/50 hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)]' : ''}
  ${severity === 'ALTA'    ? 'border-orange-500/25 hover:border-orange-500/50' : ''}
  ${severity === 'MEDIA'   ? 'border-yellow-500/25 hover:border-yellow-500/50' : ''}
  ${severity === 'BAIXA'   ? 'border-white/8 hover:border-white/16' : ''}
`}>
  {/* Barra de severidade */}
  <SeverityBar severity={severity} />

  <div className="p-4">
    {/* Header do card */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <SeverityBadge severity={severity} />
          <StatusBadge status={status} />
          {isSimulado && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded
                             bg-purple-500/10 text-purple-400 border border-purple-500/25
                             uppercase tracking-wide">
              Simulado
            </span>
          )}
        </div>
        <h3 className="text-[14px] font-semibold text-[#F0F4F8] truncate">{titulo}</h3>
      </div>
      <span className="text-[11px] text-[#64748B] flex-shrink-0">{timeAgo}</span>
    </div>

    {/* Tipo COBRADE */}
    <div className="flex items-center gap-1.5 mb-3">
      <DisasterIcon type={tipo} size={14} className="text-[#64748B]" />
      <span className="text-[12px] text-[#94A3B8]">{desastreTipo}</span>
      {cobradeCod && (
        <span className="font-mono text-[11px] text-[#3B82F6] ml-1">{cobradeCod}</span>
      )}
    </div>

    {/* Métricas rápidas */}
    <div className="grid grid-cols-3 gap-2 mb-3">
      <Metric label="Upvotes" value={upvotes} icon={<ThumbsUp size={11} />} />
      <Metric label="PCs Ativos" value={pcsAtivos} icon={<Package size={11} />} />
      <Metric label="Em Campo" value={tecnicosEmCampo} icon={<Users size={11} />} />
    </div>

    {/* Footer — localização e ações rápidas */}
    <div className="flex items-center justify-between pt-3 border-t border-white/5">
      <span className="text-[11px] text-[#64748B] flex items-center gap-1">
        <MapPin size={11} />
        {municipio} · {raioMetros / 1000}km raio
      </span>
      <div className="flex gap-1">
        <ActionButton icon={<Eye size={13} />} tooltip="Ver detalhes" />
        <ActionButton icon={<Map size={13} />} tooltip="Ver no mapa" />
        {canApprove && <ActionButton icon={<Check size={13} />} tooltip="Aprovar" variant="success" />}
      </div>
    </div>
  </div>
</div>
```

### 9.5 Badge de Severidade

```tsx
const severityConfig = {
  CRITICA: { label: 'Crítica', bg: 'bg-red-500/12', text: 'text-red-400', border: 'border-red-500/30' },
  ALTA:    { label: 'Alta',    bg: 'bg-orange-500/12', text: 'text-orange-400', border: 'border-orange-500/30' },
  MEDIA:   { label: 'Média',   bg: 'bg-yellow-500/12', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  BAIXA:   { label: 'Baixa',   bg: 'bg-green-500/12',  text: 'text-green-400',  border: 'border-green-500/30' },
};

const SeverityBadge = ({ severity }) => {
  const cfg = severityConfig[severity];
  return (
    <span className={`
      inline-flex items-center gap-1
      text-[10px] font-bold uppercase tracking-[0.08em]
      px-2 py-0.5 rounded border
      ${cfg.bg} ${cfg.text} ${cfg.border}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.text.replace('text-', 'bg-')}`} />
      {cfg.label}
    </span>
  );
};
```

### 9.6 Badge de Status do Evento

```tsx
const statusConfig = {
  SOLICITADO:     { label: 'Solicitado',     color: 'text-[#64748B] bg-white/5 border-white/10' },
  ATIVO:          { label: 'Ativo',          color: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  ALERTA_CRITICO: { label: 'Alerta Crítico', color: 'text-red-400 bg-red-500/10 border-red-500/25',
                    pulse: true },
  ENCERRADO:      { label: 'Encerrado',      color: 'text-[#64748B] bg-white/5 border-white/10' },
  CANCELADO:      { label: 'Cancelado',      color: 'text-[#64748B] bg-white/5 border-white/10' },
};

// ALERTA_CRITICO ganha animação de pulse — chama atenção do operador
// Implementado com ring pulsante via iara-pulse-critica keyframe
```

### 9.7 Botões

```css
/* Primário — ação principal da tela */
.btn-primary {
  background: #0F47BC;
  color: #FEFEFE;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid rgba(15, 71, 188, 0.5);
  transition: all 0.15s ease;
}
.btn-primary:hover {
  background: #0D439A;
  box-shadow: 0 0 16px rgba(15, 71, 188, 0.35);
}
.btn-primary:active { transform: scale(0.98); }

/* Secundário — ação alternativa */
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #94A3B8;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.15s ease;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #F0F4F8;
  border-color: rgba(255, 255, 255, 0.18);
}

/* Danger — ações destrutivas (cancelar, deletar) */
.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.btn-danger:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
}

/* Ghost — ações secundárias mínimas */
.btn-ghost {
  background: transparent;
  color: #64748B;
  border: 1px solid transparent;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #94A3B8;
  border-color: rgba(255, 255, 255, 0.06);
}

/* Icon button — botão apenas com ícone */
.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #64748B;
  transition: all 0.15s ease;
}
.btn-icon:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #94A3B8;
  border-color: rgba(255, 255, 255, 0.12);
}
```

### 9.8 Inputs e Formulários

```css
.input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 12px;
  color: #F0F4F8;
  font-family: var(--font-body);
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.input::placeholder { color: #64748B; }
.input:hover { border-color: rgba(255, 255, 255, 0.18); }
.input:focus {
  border-color: #0F47BC;
  box-shadow: 0 0 0 3px rgba(15, 71, 188, 0.2);
}
.input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Wrapper com label */
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
}
.form-label--required::after {
  content: ' *';
  color: #EF4444;
}
.form-hint {
  font-size: 11px;
  color: #64748B;
}
.form-error {
  font-size: 11px;
  color: #EF4444;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Select */
.select {
  /* Mesmas propriedades do .input */
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,..."); /* chevron custom */
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
```

### 9.9 Tabela de Dados

```tsx
// Componente de tabela padrão para listagens operacionais

<div className="rounded-xl border border-white/8 overflow-hidden">
  {/* Header da tabela */}
  <div className="flex items-center justify-between px-5 py-3.5
                  bg-[#0C1220] border-b border-white/5">
    <div className="flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-[#0F47BC]" />
      <h3 className="text-[13px] font-semibold text-[#F0F4F8]">{title}</h3>
      <span className="text-[11px] text-[#64748B] ml-1">{count} registros</span>
    </div>
    <div className="flex gap-2">
      {/* Filtros e ações da tabela */}
    </div>
  </div>

  {/* Tabela */}
  <table className="w-full">
    <thead>
      <tr className="border-b border-white/5">
        {columns.map(col => (
          <th className="px-4 py-3 text-left
                         text-[11px] font-semibold text-[#64748B]
                         uppercase tracking-[0.06em]">
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr className="
          border-b border-white/[0.04] last:border-0
          hover:bg-white/[0.025] transition-colors cursor-pointer
        ">
          {/* células */}
        </tr>
      ))}
    </tbody>
  </table>

  {/* Paginação */}
  <div className="flex items-center justify-between px-5 py-3
                  bg-[#0C1220] border-t border-white/5">
    <span className="text-[12px] text-[#64748B]">
      Mostrando {from}–{to} de {total}
    </span>
    <div className="flex gap-1">
      <PaginationButton>Anterior</PaginationButton>
      <PaginationButton active>1</PaginationButton>
      <PaginationButton>2</PaginationButton>
      <PaginationButton>Próximo</PaginationButton>
    </div>
  </div>
</div>
```

### 9.10 Modal

```tsx
// Usar Radix UI Dialog ou React Portal
// Overlay com rgba(7, 11, 20, 0.85) + backdrop-filter: blur(4px)
// No browser (não CEF) backdrop-filter funciona normalmente

<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
  {/* Overlay */}
  <div className="absolute inset-0 bg-[rgba(7,11,20,0.85)] backdrop-blur-sm"
       onClick={onClose} />

  {/* Painel do modal */}
  <div className="
    relative z-10 w-full max-w-lg
    bg-[#111827] rounded-2xl border border-white/10
    shadow-[0_24px_64px_rgba(0,0,0,0.6)]
    animate-[iara-fadeIn_0.25s_ease]
  ">
    {/* Barra de cor no topo — opcional, baseada no tipo */}
    <div className="h-px bg-gradient-to-r from-transparent via-[#0F47BC]/60 to-transparent" />

    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(15,71,188,0.1)] flex items-center justify-center text-[#3B82F6]">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.1em]">{eyebrow}</p>
          <h2 className="text-[15px] font-semibold text-[#F0F4F8]">{title}</h2>
        </div>
      </div>
      <button onClick={onClose} className="btn-icon"><X size={14} /></button>
    </div>

    {/* Conteúdo */}
    <div className="px-6 py-5">{children}</div>

    {/* Footer de ações */}
    <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5">
      <button className="btn-secondary" onClick={onClose}>Cancelar</button>
      <button className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </div>
</div>
```

### 9.11 Mapa (Componente de Mapa Fullscreen)

O mapa é o coração do IARA Web. Usa Leaflet ou MapLibre GL com tiles do OpenStreetMap.

```tsx
// Paleta de marcadores no mapa

const markerColors = {
  // Eventos por severidade
  evento_critica: '#EF4444',
  evento_alta:    '#F97316',
  evento_media:   '#EAB308',
  evento_baixa:   '#22C55E',
  // Pontos de interesse
  pc:             '#3B82F6',   // Ponto de coleta — azul brand
  abrigo:         '#8B5CF6',   // Abrigo — roxo
  hospital:       '#EC4899',   // Hospital — rosa
  zona_risco:     '#EF4444',   // Zona de risco — vermelho translúcido
  ponto_atencao:  '#F97316',   // Ponto de atenção — laranja
};

// Camadas do mapa (toggleáveis pelo operador)
const mapLayers = [
  { id: 'eventos',         label: 'Eventos Ativos',      default: true },
  { id: 'pcs',             label: 'Pontos de Coleta',    default: true },
  { id: 'abrigos',         label: 'Abrigos',             default: true },
  { id: 'hospitais',       label: 'Hospitais',           default: false },
  { id: 'zonas_risco',     label: 'Zonas de Risco',      default: true },
  { id: 'pontos_atencao',  label: 'Pontos de Atenção',   default: false },
  { id: 'estacoes_meteo',  label: 'Estações Meteo.',     default: false },
  { id: 'alertas',         label: 'Alertas Ativos',      default: true },
];

// Painel lateral flutuante sobre o mapa (ao clicar em um evento)
// Posição: direita, largura 380px, com scroll interno
// Background: bg-[#0C1220]/95 com backdrop-blur-sm
// Borda: border-l border-white/10
```

### 9.12 Dashboard de Triagem START

```tsx
// Card especializado para protocolo START — exibido na página de evento ativo

<div className="rounded-xl bg-[#111827] border border-white/8 overflow-hidden">
  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5">
    <span className="w-1 h-4 rounded-full bg-red-500" />
    <h3 className="text-[13px] font-semibold text-[#F0F4F8]">Triagem START</h3>
    <span className="text-[10px] text-[#64748B] ml-1">Protocolo de múltiplas vítimas</span>
  </div>

  <div className="p-5 grid grid-cols-4 gap-3">
    {/* VERMELHO */}
    <StartCard
      color="#EF4444"
      label="Imediato"
      count={startVermelho}
      description="Risco de vida"
      icon={<Heart size={16} />}
    />
    {/* AMARELO */}
    <StartCard color="#EAB308" label="Urgente" count={startAmarelo} description="Estável / observação" />
    {/* VERDE */}
    <StartCard color="#22C55E" label="Ambulante" count={startVerde} description="Leve / pode aguardar" />
    {/* PRETO */}
    <StartCard color="#374151" textColor="#9CA3AF" label="Expectante" count={startPreto} description="Óbito / sem chance" />
  </div>
</div>

// StartCard component
const StartCard = ({ color, textColor, label, count, description, icon }) => (
  <div className="rounded-lg p-3 flex flex-col gap-2"
       style={{ background: `${color}14`, border: `1px solid ${color}35` }}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color }}>
        {label}
      </span>
      <span style={{ color: textColor || color, opacity: 0.7 }}>{icon}</span>
    </div>
    <span className="text-[28px] font-bold tabular-nums leading-none"
          style={{ color: textColor || color }}>
      {count}
    </span>
    <span className="text-[11px]" style={{ color: '#64748B' }}>{description}</span>
  </div>
);
```

### 9.13 Skeleton / Loading State

```css
/* Skeleton shimmer para cards e tabelas enquanto dados carregam */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  background-size: 200% 100%;
  animation: iara-shimmer 1.5s ease infinite;
  border-radius: 4px;
}
```

### 9.14 Toast / Notificação

```tsx
// Usar react-hot-toast ou Sonner
// Posição: top-right, margem: 16px

const toastStyles = {
  success: {
    background: '#111827',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#F0F4F8',
    iconColor: '#22C55E',
  },
  error: {
    background: '#111827',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    iconColor: '#EF4444',
  },
  warning: {
    background: '#111827',
    border: '1px solid rgba(234, 179, 8, 0.3)',
    iconColor: '#EAB308',
  },
  // Toast especial para ALERTA CRÍTICO — mais chamativo
  critical_alert: {
    background: '#1A0808',
    border: '1px solid rgba(239, 68, 68, 0.6)',
    iconColor: '#EF4444',
    animation: 'iara-pulse-critica 2s ease infinite',
  },
};
```

### 9.15 Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
```

### 9.16 Pulse Dot (Status Online)

```tsx
// Verde = ativo/online, Amarelo = atenção, Vermelho = crítico, Cinza = offline

<span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />

// CSS
.pulse-dot { animation: iara-pulse-dot 2s ease-in-out infinite; }
```

### 9.17 Section Header Padrão

Usar consistentemente em todas as seções de dashboard e páginas:

```tsx
<div className="flex items-center gap-2.5 mb-4">
  <span className="w-[3px] h-5 rounded-full bg-[#0F47BC]" />
  <div className="flex flex-col leading-tight">
    <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.1em]">
      {eyebrow}
    </span>
    <h2 className="text-[15px] font-semibold text-[#F0F4F8]">{title}</h2>
  </div>
  {/* Ação opcional no canto direito */}
  <div className="ml-auto">{action}</div>
</div>
```

---

## 10. Páginas e Layouts

### 10.1 Dashboard Principal

```
┌────────────────────────────────────────────────────┐
│ TOPBAR                                             │
├──────────┬─────────────────────────────────────────┤
│          │ Section Header: "Visão Geral"           │
│ SIDEBAR  │                                         │
│          │ [KPI]  [KPI]  [KPI]  [KPI]  (4 cols)  │
│          │  Eventos  Técnicos  Abrigos  Doações   │
│          │                                         │
│          │ ┌──────────────────┐ ┌───────────────┐ │
│          │ │ Eventos Críticos │ │  Mapa Miniatur│ │
│          │ │ (tabela 8 cols) │ │  (4 cols)     │ │
│          │ └──────────────────┘ └───────────────┘ │
│          │                                         │
│          │ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│          │ │ Gráfico  │ │ Triagem  │ │ Notif.   │ │
│          │ │ Demandas │ │ START    │ │ Recentes │ │
│          │ │ (4 cols) │ │ (4 cols) │ │ (4 cols) │ │
│          │ └──────────┘ └──────────┘ └──────────┘ │
└──────────┴─────────────────────────────────────────┘
```

### 10.2 Mapa Fullscreen

```
┌──────────────────────────────────────────────────────────┐
│ TOPBAR (z-50, sobre o mapa)                              │
├─────────┬────────────────────────────┬───────────────────┤
│         │                            │                   │
│ SIDEBAR │      MAPA FULLSCREEN       │  PAINEL LATERAL   │
│(colaps.)│     (Leaflet/MapLibre)     │  (380px, slide-in)│
│         │                            │  Ao clicar evento:│
│         │  [Controles flutuantes]    │  - Título + status│
│         │  [Toggle de camadas]       │  - Upvotes        │
│         │  [Busca de endereço]       │  - PCs próximos   │
│         │  [Zoom]                    │  - Demandas       │
│         │                            │  - Ações rápidas  │
│         │                            │                   │
└─────────┴────────────────────────────┴───────────────────┘
```

### 10.3 Página de Aprovação de Técnicos

Lista de usuários com `cadastro_sts = PENDENTE`, layout de tabela com painel lateral de detalhe.

### 10.4 Página de Evento (detalhe)

Rota: `/eventos/:id`

```
Tabs: [Visão Geral] [Incidentes/START] [Pontos de Coleta] [Voluntários] [Abrigos] [FIDE] [Histórico]
```

### 10.5 Tela de Login (web)

```
┌────────────────────────────────────────────────────┐
│            Fundo: #070B14 (app bg)                │
│                                                    │
│  ┌──────────────────────────────────┐              │
│  │  Logo IARA centralizado          │              │
│  │  "Sistema de Gestão de Desastres"│              │
│  │  [Input: E-mail]                 │              │
│  │  [Input: Senha]                  │              │
│  │  [Botão: Entrar]  (brand blue)   │              │
│  │  [Link: Esqueceu a senha?]       │              │
│  └──────────────────────────────────┘              │
│                                                    │
│  Card: bg-[#111827], border border-white/8         │
│  Largura máxima: 400px, centralizado               │
└────────────────────────────────────────────────────┘
```

---

## 11. Ícones

Usar **Lucide React** como biblioteca principal:

```bash
npm install lucide-react
```

**Mapeamento de ícones por entidade IARA:**

| Entidade | Ícone Lucide | Observação |
|----------|-------------|------------|
| Evento/Desastre | `AlertTriangle` | Cor por severidade |
| Enchente (COBRADE) | `Waves` | |
| Incêndio (COBRADE) | `Flame` | |
| Deslizamento | `Mountain` | |
| Ponto de Coleta | `Package` | |
| Abrigo | `Home` | |
| Hospital | `Cross` | |
| Voluntário/Técnico | `UserCheck` | |
| Doador | `Heart` | |
| Coordenador | `Briefcase` | |
| Monitor | `Monitor` | |
| Gestor | `Shield` | |
| Admin | `ShieldCheck` | |
| Mapa | `Map` | |
| Alerta | `Bell` | |
| Check-in | `MapPin` | |
| Morgue | `Moon` | Acesso restrito |
| Triagem START | `Activity` | |
| FIDE/S2ID | `FileText` | |
| Simulado | `FlaskConical` | |
| Ponto de Atenção | `AlertOctagon` | |
| Industrial | `Factory` | |
| Tenant/DC | `Building2` | |
| Dashboard | `LayoutDashboard` | |
| Relatório | `BarChart2` | |
| Notificação não lida | `Bell` com badge | |
| Sincronização | `RefreshCw` | |

**Tamanhos padrão:**

| Contexto | Tamanho |
|----------|---------|
| Ícone em sidebar | `16px` |
| Ícone em botão | `14–16px` |
| Ícone em card header | `16–18px` |
| Ícone em KPI card | `20px` |
| Ícone em estado vazio | `40px` |
| Ícone de marcador no mapa | `24px` |

---

## 12. Gráficos (Recharts)

Usar **Recharts** como biblioteca de gráficos:

```bash
npm install recharts
```

### 12.1 Estilo padrão de gráficos

```tsx
// Paleta de cores para séries de dados
const chartColors = {
  primary:  '#3B82F6',  // azul brand
  critica:  '#EF4444',
  alta:     '#F97316',
  media:    '#EAB308',
  baixa:    '#22C55E',
  muted:    '#64748B',
};

// Tooltip padrão (browser suporta backdrop-filter — ao contrário do CEF)
const tooltipStyle: React.CSSProperties = {
  background: '#1A2332',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#F0F4F8',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  padding: '8px 12px',
};

// Grid do gráfico
const gridStyle = { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: '3 3' };

// Eixos
const axisStyle = { fill: '#64748B', fontSize: 11 };
```

### 12.2 Gráficos prioritários para o IARA Web

| Gráfico | Tipo | Onde |
|---------|------|------|
| Demandas vs. atendimentos | BarChart | Dashboard, página de evento |
| Eventos por severidade | PieChart/RadialBar | Dashboard |
| Triagem START por cor | BarChart horizontal | Dashboard de evento |
| Ocupação de abrigos | BarChart | Dashboard |
| Timeline de eventos | LineChart | Dashboard histórico |
| Mapa de calor de ocorrências | HeatMap no Leaflet | Mapa fullscreen |

---

## 13. Configuração do Tailwind (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand
        brand: {
          dark:   '#0F47BC',
          medium: '#0D439A',
          light:  '#3B82F6',
          white:  '#FEFEFE',
        },
        // Backgrounds
        bg: {
          app:       '#070B14',
          primary:   '#0C1220',
          secondary: '#111827',
          elevated:  '#1A2332',
        },
        // Severidade
        severity: {
          critica: '#EF4444',
          alta:    '#F97316',
          media:   '#EAB308',
          baixa:   '#22C55E',
        },
        // START
        start: {
          vermelho: '#EF4444',
          amarelo:  '#EAB308',
          verde:    '#22C55E',
          preto:    '#374151',
        },
      },
      borderRadius: {
        sm:  '4px',
        md:  '6px',
        lg:  '8px',
        xl:  '12px',
        '2xl': '16px',
      },
      boxShadow: {
        brand:   '0 0 0 1px rgba(15,71,188,0.4), 0 4px 16px rgba(15,71,188,0.2)',
        critica: '0 0 0 1px rgba(239,68,68,0.4), 0 4px 16px rgba(239,68,68,0.2)',
        inner:   'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-in':    'iara-fadeIn 0.25s ease',
        'slide-in':   'iara-slideInRight 0.25s ease',
        'pulse-dot':  'iara-pulse-dot 2s ease-in-out infinite',
        'shimmer':    'iara-shimmer 1.5s ease infinite',
      },
      screens: {
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};
```

---

## 14. Dependências React Recomendadas

```bash
# Roteamento
npm install react-router-dom

# Mapa
npm install leaflet react-leaflet
npm install @types/leaflet

# Ícones
npm install lucide-react

# Gráficos
npm install recharts

# Formulários e validação
npm install react-hook-form @hookform/resolvers zod

# Estado global (leve, sem boilerplate excessivo)
npm install zustand

# Data fetching e cache (integração com a API Spring Boot)
npm install @tanstack/react-query

# Toasts
npm install sonner

# Datas (formatar timestamps dos eventos)
npm install date-fns

# Utilitário de classnames
npm install clsx tailwind-merge
```

---

## 15. Convenções de Integração com API Spring Boot

### 15.1 Cliente HTTP

```ts
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor — injeta JWT em todas as requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('iara_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor — trata 401 (token expirado)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('iara_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

### 15.2 React Query — Padrão de Hook por Entidade

```ts
// src/hooks/useEventos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useEventos = (params?: EventosParams) =>
  useQuery({
    queryKey: ['eventos', params],
    queryFn: () => api.get('/eventos', { params }).then(r => r.data),
    refetchInterval: 30_000, // eventos atualizam a cada 30s
  });

export const useAprovarEvento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/eventos/${id}/aprovar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }),
  });
};
```

### 15.3 Variáveis de Ambiente

```env
# .env.local
VITE_API_URL=http://localhost:8080/api/v1
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 16. Checklist — Antes de Entregar uma Tela

- [ ] Todos os estados cobertos: loading (skeleton), erro, vazio e sucesso
- [ ] Dados críticos de evento com cor de severidade correta (vermelho = crítico)
- [ ] Simulados marcados com badge roxo "Simulado" — excluídos de KPIs reais
- [ ] Section headers com barra azul vertical + eyebrow uppercase
- [ ] Tabelas com paginação quando `total > 20`
- [ ] Campos LGPD:SENSIVEL nunca logados no console
- [ ] Números grandes com `tabular-nums` para evitar salto de layout
- [ ] Timestamps em formato relativo (`há 5 min`) + absoluto no tooltip
- [ ] Tokens JWT tratados no interceptor — sem lógica de auth nas telas
- [ ] React Query invalidando cache após mutations
- [ ] Responsividade mínima em `lg` (1024px) — sidebar colapsada
- [ ] Acessibilidade: inputs com `label`, botões com `aria-label`, imagens com `alt`

---

## 17. Temas (Dark / Light / System)

### 17.1 Arquitetura

A troca de tema é feita via classe no elemento `<html>`:
- `html.dark` → dark mode (padrão)
- `html.light` → light mode
- sem classe → `prefers-color-scheme` do OS (modo `system`)

Todos os tokens de cor são CSS custom properties redefinidas no seletor `html.light { }` em `globals.css`. Os tokens de severidade e brand permanecem iguais em ambos os modos.

### 17.2 Paleta Light Mode

| Token | Dark | Light |
|-------|------|-------|
| `--bg-app` | `#070B14` | `#F0F4F8` |
| `--bg-primary` | `#0C1220` | `#FFFFFF` |
| `--bg-secondary` | `#111827` | `#F8FAFC` |
| `--bg-elevated` | `#1A2332` | `#FFFFFF` |
| `--text-primary` | `#F0F4F8` | `#0F172A` |
| `--text-secondary` | `#94A3B8` | `#334155` |
| `--border-default` | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.12)` |

### 17.3 Toggle Component

```tsx
// src/components/layout/Topbar.tsx — ThemeToggle
// Cicla: dark → light → system → dark
// Ícones: Moon / Sun / Monitor (Lucide)
// Posição: entre NotificationBell e UserMenu

import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const icons = { dark: <Moon size={15} />, light: <Sun size={15} />, system: <Monitor size={15} /> };
  return (
    <button onClick={cycleTheme} title={theme} className="btn-icon">
      {icons[theme]}
    </button>
  );
}
```

### 17.4 Inicialização sem Flash (FOUC)

Um script inline em `index.html` (antes do bundle React) lê o `localStorage` e aplica a classe dark/light antes que o browser renderize qualquer pixel:

```html
<script>
  try {
    var s = localStorage.getItem('iara_theme');
    var t = s ? JSON.parse(s)?.state?.theme ?? 'dark' : 'dark';
    var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(dark ? 'dark' : 'light');
  } catch(e) { document.documentElement.classList.add('dark'); }
</script>
```

### 17.5 Persistência

O tema é persistido no `localStorage` via Zustand persist (`iara_theme`). O hook `useTheme()` em `App.tsx` sincroniza o estado com a classe no `<html>` e escuta mudanças de `prefers-color-scheme` quando em modo `system`.

---

*IARA Design System Web — v1.1*
*Plataforma de Comando e Controle · Defesa Civil*
