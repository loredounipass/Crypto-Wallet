import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.module';

@Injectable()
export class EmailThrottlerGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const email = request.user?.email || request.body?.email?.toString().trim().toLowerCase();
    const identifier = email || request.ip;

    if (!identifier) return true;

    const path = request.route?.path || request.url;
    const key = `rate-limit:email:${path}:${identifier}`;

    const limit = 10;
    const windowSeconds = 900;

    const rawResults = await this.redisClient
      .multi()
      .set(key, 0, 'EX', windowSeconds, 'NX')
      .incr(key)
      .ttl(key)
      .exec();

    // Normalizamos el resultado para soportar tanto ioredis [[err, val], [err, val]] como node-redis [val, val, val]
    const parsedResults = rawResults.map((res: any) => (Array.isArray(res) ? res[1] : res));
    
    // index 0: resultado del SET (no lo necesitamos)
    // index 1: resultado del INCR
    // index 2: resultado del TTL
    const currentRequests = parsedResults[1] as number;
    const currentTtl = parsedResults[2] as number;

    if (currentRequests > limit) {
      const remainingSeconds = currentTtl > 0 ? currentTtl : windowSeconds;
      const minutes = Math.ceil(remainingSeconds / 60);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Demasiados intentos. Por favor, vuelve a intentar en ${minutes} minuto(s).`,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
