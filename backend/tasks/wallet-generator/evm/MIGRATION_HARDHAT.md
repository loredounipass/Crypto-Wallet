# Migración de Truffle a Hardhat (Módulo Task - Wallet Generator)

## Resumen de Cambios
- Se reemplazó **Truffle** (`truffle-config.js`, `@truffle/contract`, `@truffle/hdwallet-provider`) por **Hardhat** (`hardhat.config.js`, `ethers.js`, `@nomicfoundation/hardhat-toolbox`).
- Se actualizaron los contratos inteligentes (`GeneratorFactoryContract.sol` y `WalletContract.sol`) para usar `pragma solidity ^0.8.20`.
- Los scripts de migración (`migrations/`) fueron reemplazados por el script de despliegue `scripts/deploy.js`.
- Se adaptaron los scripts generadores (`generate.js` y `factories/generatorFactory.js`) para utilizar `ethers.js` y decodificar correctamente los eventos `WalletGenerated`.
- Se crearon pruebas unitarias completas bajo el directorio `test/GeneratorFactory.test.js` utilizando Chai y Mocha (ejecutables con `npx hardhat test`).

## Uso de Hardhat

### Compilación
```bash
npx hardhat compile
```

### Pruebas (Tests locales)
```bash
npx hardhat test
```

### Despliegue (Testnet/Mainnet)
Para desplegar en la testnet de Binance Smart Chain (ejemplo `97`):
```bash
npx hardhat run scripts/deploy.js --network 97
```
(Asegúrate de que tus variables de entorno en `config/.env` estén configuradas).

### Generación de Wallets
La generación se sigue haciendo con:
```bash
node generate.js <CANTIDAD> <NETWORK_ID>
```

---

## Plan de Pruebas Exhaustivas en Testnet
1. **Despliegue Inicial**: Ejecuta `npx hardhat run scripts/deploy.js --network 97` (BSC Testnet) o Sepolia.
2. **Generación de Billeteras**: Ejecuta `node generate.js 5 97` y verifica en el explorador de bloques (BscScan Testnet) que el evento se haya emitido y los contratos `WalletContract` hayan sido creados y guardados en la base de datos (Mongoose).
3. **Pruebas de Recepción de Fondos**: Transfiere tokens de prueba (e.g. tBNB) a la billetera generada y confirma que la función de redireccionamiento (forward al `HOT_WALLET`) opera exitosamente.

## Plan de Rollback (En caso de fallos críticos en Mainnet)
Dado que el código fuente anterior de los contratos no sufrió alteraciones lógicas (sólo la actualización del pragma), la retrocompatibilidad está garantizada. Si Hardhat presenta problemas durante la transición a Mainnet:
1. **Revertir Código**: Utiliza `git revert` al último commit antes de esta migración.
2. **Restaurar Dependencias**: Ejecuta `pnpm install` para restaurar los módulos de Truffle.
3. **Uso de Contratos Antiguos**: Los archivos JSON compilados por Truffle se pueden seguir leyendo, por lo que la generación antigua funcionaría sin interrupción.
4. **Respaldo de Base de Datos**: Si un despliegue defectuoso genera billeteras no funcionales, se pueden marcar como "inactivas" en MongoDB filtrando por el timestamp del despliegue fallido.