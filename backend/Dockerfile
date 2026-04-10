FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies (usamos node:20 completo para evitar errores de node-gyp con librerías crypto)
RUN pnpm install

# Copy the rest of the application
COPY . .

# Run the application with node
CMD ["node", "dist/main.js"]