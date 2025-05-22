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

RUN pnpm dlx turbo prune --scope=backend --docker

# installer
FROM base AS installer
RUN apk add --update --no-cache libc6-compat && rm -rf /var/cache/apk/*

WORKDIR /app

COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/ .

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

EXPOSE 3001

COPY ./apps/backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]
