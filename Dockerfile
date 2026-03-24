# ─────────────────────────────────────────────────────────────────────────────
#  HireFlow Frontend — Multi-stage Docker build
#  Stage 1: build   (Node 20 Alpine — installs deps and compiles)
#  Stage 2: serve   (Nginx Alpine — serves static files, ~15 MB final image)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first (better layer caching)
COPY package.json package-lock.json ./

# Install ALL deps (including devDeps for the build)
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# Build args that become env variables during the Vite build
ARG VITE_API_URL=http://localhost:3001
ARG VITE_HF_ENABLED=true
ARG VITE_ENV=production
ARG VITE_APP_VERSION=unknown
ARG VITE_SENTRY_DSN=""

ENV VITE_API_URL=$VITE_API_URL \
    VITE_HF_ENABLED=$VITE_HF_ENABLED \
    VITE_ENV=$VITE_ENV \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Type-check + build
RUN npm run build


# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS serve

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
