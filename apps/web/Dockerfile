FROM node:22-alpine3.20 AS base

ARG PNPM_VERSION=10.6.5
ENV PNPM_HOME=/usr/local/bin

RUN npm install -g corepack@latest
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# builder
FROM base AS builder
RUN apk add --update --no-cache libc6-compat && rm -rf /var/cache/apk/*

WORKDIR /app

COPY . .

RUN pnpm dlx turbo prune --scope=web --docker

# installer
FROM base AS installer
RUN apk add --update --no-cache libc6-compat && rm -rf /var/cache/apk/*

WORKDIR /app

ARG DATABASE_URL
ARG AUTH_SECRET
ARG AUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG AUTH_GITHUB_ID
ARG AUTH_GITHUB_SECRET
ARG AUTH_GOOGLE_CLIENT_ID
ARG AUTH_GOOGLE_CLIENT_SECRET
ARG AUTH_SLACK_CLIENT_ID
ARG AUTH_SLACK_CLIENT_SECRET
ARG EMAIL_HOST
ARG EMAIL_PORT
ARG EMAIL_NAME
ARG EMAIL_USER
ARG EMAIL_PASS
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG RECAPTCHA_SECRET_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG API_SECRET
ARG API_SECRET_BACKEND
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG DISABLE_EVENTS
ARG DISABLE_EVENTS_SENSITIVE_VARIABLES
ARG ENCRYPTION_KEY
ARG KAFKA_URL
ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG DISABLE_EMAIL

ENV SKIP_ENV_VALIDATION=true

COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/out/json/ .

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

RUN pnpm build --filter web

# runner
FROM base AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/next.config.ts .
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/next.config.ts .
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD ["node", "apps/web/server.js"]
