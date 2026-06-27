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

    try {
      const currentRequests = await this.redisClient.incr(key);
      if (currentRequests === 1) {
        await this.redisClient.expire(key, windowSeconds);
      }

      const ttl = await this.redisClient.ttl(key);

      if (currentRequests > limit) {
        const remainingSeconds = ttl > 0 ? ttl : windowSeconds;
        const minutes = Math.ceil(remainingSeconds / 60);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Too many attempts. Please try again in ${minutes} minute(s).`,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[EmailThrottlerGuard] Redis error:', msg);
    }

    return true;
  }
}
