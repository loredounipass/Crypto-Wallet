FROM node:20

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY app-core/package.json app-core/pnpm-lock.yaml ./app-core/
WORKDIR /usr/src/app/app-core
RUN pnpm install

WORKDIR /usr/src/app

COPY . .

WORKDIR /usr/src/app/app-core
RUN pnpm run build

WORKDIR /usr/src/app

CMD ["node", "start-all.js"]