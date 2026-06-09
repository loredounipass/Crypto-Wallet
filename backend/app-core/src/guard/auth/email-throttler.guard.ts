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

    const results = await this.redisClient.multi().incr(key).ttl(key).exec() as [[null, number], [null, number]];
    const currentRequests = results[0][1];
    const ttl = results[1][1];

    if (ttl === -1 || currentRequests === 1) {
      await this.redisClient.expire(key, windowSeconds);
    }

    if (currentRequests > limit) {
      const remainingTime = ttl > 0 ? ttl : windowSeconds;
      const minutes = Math.ceil(remainingTime / 60);

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
