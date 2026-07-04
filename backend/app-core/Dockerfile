FROM node:20-alpine AS builder

RUN apk add --no-cache wget && \
    npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-core,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN pnpm build

COPY languages ./languages

FROM node:20-alpine

RUN apk add --no-cache wget && \
    npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-core-prod,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/languages ./languages

ENV NODE_ENV=production

RUN chown -R node:node /usr/src/app

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider --server-response http://localhost:4000/ 2>&1 | grep -q "HTTP/" || exit 1

CMD ["node", "dist/main"]
