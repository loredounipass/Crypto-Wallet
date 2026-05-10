# BlockVault

BlockVault is a comprehensive cryptocurrency wallet platform designed to facilitate secure and efficient transfers across multiple EVM-compatible blockchain networks. Built with modern technologies including NestJS, React, and Hardhat, it enables seamless peer-to-peer (P2P) transactions, multi-chain wallet management, P2P trading, and decentralized escrow operations through smart contracts. The platform features a robust P2P marketplace where users can securely exchange cryptocurrencies directly with built-in chat functionality, order management, and advanced security features including two-factor authentication.

## 🛠️ Technology Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=000)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

# Setup env node

Windows
```
$ set NODE_OPTIONS=--openssl-legacy-provider
```
Linux
```
$ export NODE_OPTIONS=--openssl-legacy-provider
```

# Start frontend
```
$ cd frontend  
$ pnpm install
```
```
$ pnpm start
```
# Install backend dependencies
```
$ cd backend  
$ pnpm install
$ pnpm install -g solc
```

# Start app-core
```
$ cd backend/app-core  
$ pnpm i -g @nestjs/cli  
$ pnpm install
```
```
$ nest start --watch (listening mode)  
$ nest start
```

# Start Daemons and Workers (via Docker)
```
$ docker-compose up backend-daemons-workers
$ docker-compose logs -f backend-daemons-workers
$ docker-compose down
```

# Start all instances with Docker
```
$ docker-compose up  
$ docker-compose down
$ docker-compose up --build -d
$ docker-compose logs -f backend-daemons-workers
```
All services (Redis, MongoDB, Backend, Frontend) will be running in Docker containers.

# Deploy smart contract and generate wallets 
```
$ cd backend/tasks/+
$ pnpm install -g hardhat  
$ hardhat run scripts/deploy.js --network (--network name--)  
$ node generate.js (--number of wallets--) + (--network ID--)
```

# Screenshots  

# Login  
![Login](frontend/src/assets/screenshots/Login.png)  

# Register  
![Register](frontend/src/assets/screenshots/Register.png)  

# 2FA Auth  
![2FA](frontend/src/assets/screenshots/2FA.png)  

# Dashboard  
![Home](frontend/src/assets/screenshots/Home.png)  

# Wallets  
![Wallets](frontend/src/assets/screenshots/wallets.png)  

# Settings  
![Settings](frontend/src/assets/screenshots/Settings.png)  

# Transactions  
![Transa](frontend/src/assets/screenshots/trans.png)  

# Transactions History  
![Transa](frontend/src/assets/screenshots/history.png)  

# Dashboard wallets  
![Wallet](frontend/src/assets/screenshots/wallet.png)

# P2P Trading
![Trading P2P](frontend/src/assets/screenshots/trading-p2p.png)

# P2P Orders
![P2P Orders](frontend/src/assets/screenshots/p2p-orders.png)

# P2P Chat
![P2P Chat](frontend/src/assets/screenshots/p2p-chat.png)  
