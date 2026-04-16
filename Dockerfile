# =============================================================================
# Lackey Care Navigation — Production Dockerfile
# Multi-stage build: deps → build → production runtime
#
# Usage:
#   docker build -t lackey-care-nav .
#   docker run -p 3000:3000 --env-file .env lackey-care-nav
#
# Or via docker-compose (recommended):
#   docker compose up
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install libc6-compat for Alpine compatibility with some native modules
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 2: Build the Next.js application
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars. PAYLOAD_SECRET and DATABASE_URI are required at build
# time because Payload generates types and validates config during `next build`.
# These can be dummy values if the real secrets aren't available at build time —
# the runtime values from the container's environment will take precedence.
ARG PAYLOAD_SECRET=build-time-placeholder
ARG DATABASE_URI=postgresql://placeholder:5432/placeholder
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV DATABASE_URI=${DATABASE_URI}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime (minimal image)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed at runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Payload needs access to its config and collections at runtime
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/payload.config.ts ./payload.config.ts 2>/dev/null || true

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone server
CMD ["node", "server.js"]
