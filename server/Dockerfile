# ─────────────────────────────────────────────────────────────────────────────
#  HireFlow Backend — Express + TypeScript
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build          # tsc → dist/


FROM node:20-alpine AS serve

WORKDIR /app

# Production deps only
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile --omit=dev

COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Allow runtime uploads in container
RUN mkdir -p /app/uploads/cvs && chown -R appuser:appgroup /app/uploads

USER appuser


ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/server.js"]
