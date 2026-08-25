import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;



  // ESTABLECE LA CONEXION A REDIS CONFIGURANDO CLIENTES INDEPENDIENTES PARA PUBLICACION Y SUSCRIPCION DE EVENTOS
  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      },
      password: process.env.REDIS_PASS,
    });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }



  // CREA Y CONFIGURA LA INSTANCIA DEL SERVIDOR DE WEBSOCKETS VINCULANDO EL ADAPTADOR DE REDIS PARA ESCALABILIDAD
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
