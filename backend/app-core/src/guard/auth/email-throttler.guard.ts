import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

// Guard personalizado usando Redis para proteger endpoints sensibles de envíos masivos o fuerza bruta
@Injectable()
export class EmailThrottlerGuard implements CanActivate {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Usar email autenticado, o email del body, o la IP como último recurso
    const identifier = request.user?.email || request.body?.email || request.ip;
    const path = request.route?.path || request.url;
    
    // Llave única en Redis
    const key = `rate-limit:email:${path}:${identifier}`;
    
    // Configuración: Máximo 10 intentos por ventana
    const limit = 10;
    const windowSeconds = 900; // 15 minutos

    const currentRequests = await this.redisClient.incr(key);

    // Si es la primera petición, establecer el tiempo de expiración
    if (currentRequests === 1) {
      await this.redisClient.expire(key, windowSeconds);
    }

    if (currentRequests > limit) {
      const ttl = await this.redisClient.ttl(key);
      const minutes = Math.ceil(ttl / 60);
      throw new HttpException(
        `Demasiados intentos. Por favor, vuelve a intentar en ${minutes} minuto(s).`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
