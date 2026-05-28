# IARA Web — Comando e Controle

Frontend web da plataforma IARA (Defesa Civil), focado em **gestores e operadores**
(ADMIN, GESTOR, MONITOR): consciência situacional, análise e tomada de decisão.

Stack: **React 18 · Vite · TypeScript · TailwindCSS**, React Query, Zustand,
React Router, React Leaflet, Recharts, react-hook-form + zod, Sonner.

## Pré-requisitos

- Node 20+
- Backend IARA rodando em `http://localhost:8080` (ver `backend-api/iara-api`).
  Suba a infra (Postgres/PostGIS, Redis, RabbitMQ) com o compose do backend e
  inicie o Spring Boot.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # ajuste se necessário
npm run dev                  # http://localhost:5173
```

O Vite faz **proxy de `/api` → `http://localhost:8080`** (veja `vite.config.ts`),
evitando CORS. Para apontar a outro backend em dev, defina `VITE_PROXY_TARGET`.

## Build de produção

```bash
npm run build      # type-check + bundle em dist/
npm run preview    # serve o build localmente
```

## Docker

A imagem é multi-stage (build Vite → nginx). O **nginx serve o SPA e faz
reverse-proxy de `/api` para o backend**, resolvendo CORS sem alterar o backend.

```bash
# backend rodando no host (fora do Docker)
docker compose up --build
# → http://localhost:5173

# backend em outro host/serviço
BACKEND_URL=http://iara-api:8080 docker compose up --build
```

`BACKEND_URL` é injetado no `nginx.conf` via envsubst (filtro restrito a essa
variável, preservando `$host`/`$uri` do nginx).

## Arquitetura

```
src/
  lib/         api (axios + refresh 401), queryClient, utils (cn, datas, cores)
  store/       authStore (zustand + persist, hierarquia de perfis)
  types/       contrato da API (DTOs do handout_doc.md)
  hooks/       React Query por entidade (eventos, dashboard, PCs, abrigos, …)
  components/
    ui/        biblioteca de UI do design system (Button, StatCard, Badges, Table, Modal, …)
    layout/    Topbar, Sidebar, NotificationBell, AppLayout
    EventoCard, StartTriageCard
  routes/      router + ProtectedRoute (gate por perfil)
  pages/       Dashboard, Eventos (+ detalhe c/ abas), Mapa, PontosColeta, Abrigos, …
  styles/      globals.css (tokens, keyframes, classes utilitárias do design system)
```

### Decisões relevantes

- **Base da API:** `/api` (context-path do Spring). O `/api/v1` citado no design
  system está desatualizado.
- **Tempo real:** *polling* via React Query (eventos 30s, contador de notificações 20s).
  O backend não expõe WebSocket/SSE, e o navegador não acessa Redis/RabbitMQ
  diretamente (são server-side). O cache do cliente é o do React Query.
- **Auth:** JWT Bearer com refresh silencioso no interceptor (401 → `/auth/refresh`
  → retry). Login-only — novas contas de gestor são criadas por ADMIN/GESTOR.
- **Mapa:** React Leaflet com tiles OSM, marcadores por severidade (CircleMarker,
  sem assets de ícone) e camadas alternáveis.

## Escopo desta entrega (fundação + páginas core)

Prontas: **Login, Dashboard, Eventos (lista + detalhe com abas), Mapa,
Pontos de Coleta, Abrigos.** As demais telas de gestão (Hospitais, Usuários,
Zonas de Risco, Tenants, …) têm rota e placeholder, prontas para conectar aos
endpoints já mapeados em `hooks/` e `types/`.
