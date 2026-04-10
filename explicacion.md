# Guía de Despliegue de Contratos con Hardhat

Esta guía explica paso a paso cómo configurar tu entorno, usar el archivo `.env` y desplegar el contrato `GeneratorFactoryContract` utilizando la nueva arquitectura con Hardhat.

## 1. Configuración del Archivo `.env`

Todo el sistema de despliegue y generación de billeteras depende de las variables de entorno definidas en tu archivo `config/.env`.

**Paso a paso:**
1. Ve a la carpeta `backend/config/`.
2. Verás un archivo llamado `.env.example`. Cópialo y renómbralo a `.env`.
3. Abre el nuevo archivo `.env` y llena los datos necesarios para las redes en las que deseas desplegar. 

Para desplegar contratos, Hardhat necesita dos cosas principales por cada red:
- **RPC URL:** El punto de conexión a la blockchain (ej. Alchemy, Infura, etc.).
- **PRIVATE KEY:** La llave privada de la billetera (owner) que pagará el gas del despliegue y será dueña del contrato.

### Ejemplo para Binance Smart Chain (Testnet - ID 97)
En tu `.env` deberías tener algo así:
```env
# BSC CONFIG
BSC_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_WSS=wss://bsc-testnet.nodereal.io/ws/v1/tu_apikey
BNB_GENERATOR_ADDRESS=0xTuDireccionPublicaAqui
BNB_GENERATOR_PRIVATE_KEY=TuLlavePrivadaAquiSinEl0x
```
*(Nota: Asegúrate de que la billetera asociada a tu llave privada tenga fondos suficientes de prueba, como tBNB, para pagar el despliegue).*

## 2. ¿Cómo lee Hardhat esta configuración?

Gracias a la migración, Hardhat está configurado para leer de forma automática los archivos dentro de la carpeta `backend/config/chains/`.

Por ejemplo, el archivo `97.js` (que corresponde al Chain ID de BSC Testnet) hace lo siguiente:
```javascript
module.exports = {
    rpc: process.env.BSC_RPC,
    wss: process.env.BSC_WSS,
    g_address: process.env.BNB_GENERATOR_ADDRESS,
    g_address_pk: process.env.BNB_GENERATOR_PRIVATE_KEY,
    name: 'bsc' // ¡Este es el nombre de la red para Hardhat!
}
```
El `hardhat.config.js` toma este archivo y crea dinámicamente una red llamada **`bsc`** con el RPC y la llave privada que configuraste en tu `.env`.

## 3. Pasos para Desplegar el Contrato

Una vez que tu `.env` está configurado con los RPCs y llaves privadas, sigue estos pasos desde tu terminal:

### Paso 3.1: Ubicarte en el directorio correcto
Abre tu terminal y navega hasta la carpeta del generador EVM:
```bash
cd backend/tasks/wallet-generator/evm
```

### Paso 3.2: Compilar los contratos
Antes de desplegar, asegúrate de que los contratos estén compilados con la última versión:
```bash
npx hardhat compile
```

### Paso 3.3: Ejecutar el script de despliegue
Utiliza el comando `run` de Hardhat pasándole el flag `--network` seguido del nombre de la red que configuraste (el `name` dentro de los archivos de `config/chains/`).

**Para desplegar en BSC (Testnet 97):**
```bash
npx hardhat run scripts/deploy.js --network bsc
```

**Para desplegar en Avalanche (Fuji Testnet 43113):**
*(Asegúrate de configurar `AVALANCHE_RPC` y `AVAX_GENERATOR_PRIVATE_KEY` en tu `.env`)*
```bash
npx hardhat run scripts/deploy.js --network avalanche
```

**Para desplegar en Ethereum (Sepolia/Goerli):**
```bash
npx hardhat run scripts/deploy.js --network ethereum
```

## 4. ¿Qué sucede durante el despliegue?

Cuando ejecutas el script de despliegue (`scripts/deploy.js`), el sistema realiza lo siguiente:
1. Conecta tu llave privada al RPC de la red elegida.
2. Despliega el `GeneratorFactoryContract` en la blockchain.
3. Espera a que la transacción se confirme.
4. **IMPORTANTE:** Guarda automáticamente la dirección del contrato desplegado y el hash de la transacción en el archivo `contracts/abis/GeneratorFactoryContract.json` bajo el Chain ID correspondiente (ej. `"97"`).

Esto garantiza que el resto de tu backend (como `generate.js`) siga funcionando exactamente igual que antes, leyendo el JSON para saber dónde interactuar.

## 5. ¿Cómo generar Wallets (Billeteras) una vez desplegado el contrato?

Una vez que has desplegado exitosamente el contrato `GeneratorFactoryContract` en tu red deseada, puedes empezar a generar billeteras individuales que tus usuarios podrán utilizar para depositar fondos.

El script encargado de esto es `generate.js`, y funciona utilizando Node.js puro (ya no Hardhat directamente).

### Estructura del comando
```bash
node generate.js <CANTIDAD_DE_WALLETS> <NETWORK_ID>
```

- `<CANTIDAD_DE_WALLETS>`: Cuántas direcciones nuevas deseas crear (ej. `5`, `10`, `50`).
- `<NETWORK_ID>`: El ID numérico de la cadena donde desplegaste el contrato. Esto debe coincidir con el nombre del archivo dentro de `config/chains/` (ej. `97` para BSC Testnet, `43113` para Avalanche Fuji).

### Ejemplos Prácticos

**1. Generar 5 wallets en Binance Smart Chain Testnet (ID: 97)**
```bash
node generate.js 5 97
```

**2. Generar 10 wallets en Avalanche Fuji Testnet (ID: 43113)**
```bash
node generate.js 10 43113
```

### ¿Qué hace internamente el script `generate.js`?
1. Se conecta a la base de datos de MongoDB configurada en tu `.env`.
2. Lee el archivo `config/chains/<NETWORK_ID>.js` para obtener el RPC y la llave privada del creador.
3. Ejecuta la función `generate()` del contrato `GeneratorFactoryContract` que desplegaste previamente.
4. Captura la nueva dirección de la billetera recién creada desde el evento de la blockchain.
5. **Guarda la nueva dirección en tu base de datos MongoDB** (modelo `WalletContract`), quedando lista para ser asignada a un usuario de tu plataforma.
6. Realiza una pausa de 3 segundos entre cada creación para evitar saturar el RPC público y evitar errores de rate-limit.

---
**Resumen rápido de flujo completo:**
```bash
# 1. Configurar .env
# 2. cd backend/tasks/wallet-generator/evm
# 3. npx hardhat compile
# 4. npx hardhat run scripts/deploy.js --network bsc     <-- (Despliega el contrato padre)
# 5. node generate.js 10 97                              <-- (Genera 10 wallets hijas en la DB)
```
