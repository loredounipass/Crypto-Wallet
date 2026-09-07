FROM node:20-alpine

RUN apk add --no-cache wget && \
    npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

COPY . .

ENV NODE_ENV=production \
    CI=true

RUN chown -R node:node /usr/src/app

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD pgrep -f "node start-all.js" > /dev/null && \
    pgrep -f "subscriptions/chain/evm" > /dev/null && \
    pgrep -f "workers/chain" > /dev/null || exit 1

CMD ["node", "start-all.js"]
