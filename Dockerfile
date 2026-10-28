# syntax=docker/dockerfile:1

# Two targets ship from this file:
#   runner — the Next.js server, built with output: "standalone"
#   scan   — full source + node_modules, for `npx tsx scripts/search-led-scan.ts`
# Both come from the same Node base so the runtime never drifts from the build.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app


# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci


# ---- build ------------------------------------------------------------------
FROM base AS builder
ENV BUILD_TARGET=container
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# src/lib/auth.ts throws at import time when JWT_SECRET is absent, and the build
# imports the route handlers, so a placeholder is required here. The real secret
# is injected at runtime and overwrites this value; it is never read from the image.
ARG JWT_SECRET=build-only-placeholder
ENV JWT_SECRET=${JWT_SECRET}

# Same reason: src/lib/db.ts throws at module evaluation, and Next collects page
# data for every route handler during the build.
ARG MONGODB_URI=mongodb://build-only-placeholder
ENV MONGODB_URI=${MONGODB_URI}

# Inlined into the client bundle at build time, so it cannot come from runtime
# env. Node reads it, Vercel/Netlify set it; here it comes from the build arg.
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}

RUN npm run build


# ---- runtime: the Next.js server --------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0

# next/font/google is fetched at build time; nothing here needs the network.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Reports written by the scan timer are mounted here read-only for the admin panel.
RUN mkdir -p /var/log/terror-tracker/reports && chown -R node:node /var/log/terror-tracker

USER node
EXPOSE 3001

# Liveness only: proves the server answers. Mongo readiness is probed by deploy.sh,
# which checks an endpoint that actually reads the database.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/version').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]


# ---- runtime: the scheduled collector ---------------------------------------
# The scan runs TypeScript directly through tsx, so it needs the source and the
# full dev dependency tree rather than the standalone bundle.
FROM base AS scan
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
USER node
CMD ["npx", "tsx", "scripts/search-led-scan.ts"]
