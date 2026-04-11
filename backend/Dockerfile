FROM node:20

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY . .

ENV CI=true

RUN pnpm install

CMD ["node", "start-all.js"]