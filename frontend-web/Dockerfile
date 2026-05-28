# ============================================================
# Stage 1 — build (Vite + TypeScript)
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
# Em produção a API é resolvida pelo nginx (reverse proxy), então /api relativo.
ENV VITE_API_URL=/api
RUN npm run build

# ============================================================
# Stage 2 — serve estático com nginx + reverse proxy /api
# ============================================================
FROM nginx:1.27-alpine AS runtime
# Template processado por envsubst no boot do nginx. O filtro garante que
# apenas BACKEND_URL seja substituído — variáveis do nginx ($host, $uri) ficam intactas.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV BACKEND_URL=http://host.docker.internal:8080
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
