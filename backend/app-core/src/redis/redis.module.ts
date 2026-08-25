import { Module, Global, OnModuleDestroy, Inject } from '@nestjs/common';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const client = createClient({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT!),
          },
          password: process.env.REDIS_PASS,
        });
        client.on('error', (err) => console.error('[Redis Global] Error:', err.message));
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: any) {}



  // CIERRA LA CONEXION GLOBAL DE REDIS DE FORMA SEGURA CUANDO EL MODULO SE DESTRUYE O LA APLICACION SE DETIENE
  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }
}
