# Migración de Workers y Daemons a Docker (PM2 a Docker Compose)

## Resumen de la migración
Anteriormente, los workers y daemons (servicios en segundo plano que escuchan la red blockchain) definidos en `process.json` se inicializaban manualmente a través de `pm2 start process.json` en la terminal local. Esto provocaba inestabilidad ("stopped") debido al cierre de la sesión de terminal o a conflictos con las rutas y versiones de Node en el entorno local de Windows.

Hemos migrado toda esta infraestructura para que se ejecute dentro de un contenedor Docker aislado y orquestado por `docker-compose`, lo que garantiza que los servicios se levanten automáticamente junto con la base de datos (MongoDB) y la caché (Redis), manteniéndose activos.

## 1. El Dockerfile del Backend
Se ha creado un [Dockerfile](../backend/Dockerfile) en la carpeta `backend/`. Este archivo realiza las siguientes tareas de automatización:
1. Utiliza la imagen oficial de Node.js v20 (`node:20-alpine`) ligera.
2. Instala globalmente `pnpm` (el gestor de paquetes del proyecto) y `pm2`.
3. Instala todas las dependencias definidas en tu `pnpm-lock.yaml`.
4. Copia el código fuente completo del backend.
5. Define el comando de arranque: `pm2-runtime start process.json`.

*Nota: Utilizamos `pm2-runtime` en lugar del comando `pm2` clásico porque `pm2-runtime` está diseñado específicamente para contenedores Docker; mantiene el proceso en el foreground (primer plano) evitando que el contenedor muera.*

## 2. Orquestación en `docker-compose.yml`
Se ha actualizado el archivo [docker-compose.yml](../docker-compose.yml) que está en la raíz del proyecto para añadir el nuevo servicio de tus workers:

```yaml
  backend-daemons-workers:
    build:
      context: ./backend
      dockerfile: Dockerfile
    depends_on:
      - mongodb
      - redis
    environment:
      - DB_HOST=mongodb
      - DB_PORT=27017
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./backend/config/.env:/usr/src/app/config/.env
    networks:
      - backend
```

### ¿Qué significa esta configuración?
- **`build`**: Docker leerá tu carpeta `/backend` y utilizará el `Dockerfile` creado para generar la imagen.
- **`depends_on`**: Asegura que MongoDB y Redis se inicien **antes** que los workers.
- **`environment`**: Sobrescribe dinámicamente las variables de tu `.env` para indicarle a la aplicación que MongoDB y Redis ya no están en `127.0.0.1` (localhost), sino en los nombres de los contenedores Docker (`mongodb` y `redis`).
- **`volumes`**: Mapea en tiempo real tu archivo local `backend/config/.env` al interior del contenedor. **Cualquier cambio que hagas en tu `.env` local se reflejará dentro de Docker.**

## 3. Comandos de Uso

### Para iniciar todo el entorno (Mongo, Redis, y tus Workers):
Abre una terminal en la **raíz de tu proyecto** (`C:\Users\leida\Downloads\Crypto-Wallet`) y ejecuta:

```bash
docker-compose up -d --build
```
*(El flag `--build` asegura que Docker re-compile el código si hiciste cambios, y `-d` lo ejecuta en segundo plano).*

### Para ver si los workers y daemons de PM2 están corriendo bien:
Puedes revisar los logs en vivo generados por PM2 dentro de tu contenedor ejecutando:
```bash
docker-compose logs -f backend-daemons-workers
```

### Para reiniciar los servicios si modificas el `.env` o el código:
```bash
docker-compose restart backend-daemons-workers
```

### Para apagar todo el entorno:
```bash
docker-compose down
```

Con este sistema, ya no tienes que abrir múltiples terminales ni lidiar con PM2 localmente. Tus 14 procesos (Broadcast NODEs y Worker NODEs) se iniciarán automáticamente de forma limpia en el servidor Dockerizado.
