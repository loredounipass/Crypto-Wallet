FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Instalar pnpm y pm2 globalmente
RUN npm install -g pnpm pm2

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies (usamos node:20 completo para evitar errores de node-gyp con librerías crypto)
RUN pnpm install

# Copy the rest of the application
COPY . .

# Comando por defecto para correr con pm2-runtime
CMD ["pm2-runtime", "start", "process.json"]