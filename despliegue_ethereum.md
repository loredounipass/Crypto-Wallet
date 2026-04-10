# Reporte de Despliegue en la red de Ethereum (Sepolia)

## 1. Verificación del entorno (`.env`)
Se revisó el archivo `backend/config/.env` para validar la configuración de la red de Ethereum. Las variables utilizadas fueron:
- **ETHEREUM_RPC**: `https://eth-sepolia.g.alchemy.com/v2/Qj0fvDRq7rogygQcmeAQEfF0V5CKCJ4Q` (Sepolia Testnet)
- **ETHEREUM_WSS**: `wss://eth-sepolia.g.alchemy.com/v2/Qj0fvDRq7rogygQcmeAQEfF0V5CKCJ4Q`
- **ETH_GENERATOR_ADDRESS**: `0x91a2b4dF6Ca3C09C5B5B170AD319D7fec2F8EEFD`
- **ETH_GENERATOR_PRIVATE_KEY**: Validada desde MetaMask con fondos en Sepolia ETH.

Además, los servicios requeridos de MongoDB y Redis están corriendo en el host local en los puertos correspondientes (`27020` y `6379`), gracias a los contenedores Docker previamente inicializados.

## 2. Ejecución del Despliegue
Se ejecutó el script de despliegue mediante el comando de Hardhat en el directorio `backend/tasks/wallet-generator/evm`:

```bash
npx hardhat run scripts/deploy.js --network ethereum
```

## 3. Resultados del Despliegue
El contrato inteligente **`GeneratorFactoryContract`** fue compilado y desplegado exitosamente en la red de Ethereum (Sepolia, Chain ID `11155111`).

- **Dirección del Contrato Desplegado:** `0xE8e6C9614922E33e48aFaca5AB1E4Cd2Baed90d2`
- **Hash de la Transacción:** `0x35b1a4465230dbfd665181c4e8b3b97f2448ab501d795e5780c11d5b30715eaf`

## 4. Actualización del ABI y Estado
El script actualizó automáticamente el archivo local `contracts/abis/GeneratorFactoryContract.json`. Este archivo ahora contiene el registro del despliegue en el nodo `"11155111"`:

```json
"11155111": {
  "events": {},
  "links": {},
  "address": "0xE8e6C9614922E33e48aFaca5AB1E4Cd2Baed90d2",
  "transactionHash": "0x35b1a4465230dbfd665181c4e8b3b97f2448ab501d795e5780c11d5b30715eaf"
}
```

A partir de este momento, puedes utilizar el script de generación (e.g. `node generate.js 5 11155111`) para empezar a crear billeteras en la red de Ethereum (Sepolia), las cuales quedarán guardadas automáticamente en tu instancia de MongoDB desplegada por Docker.
