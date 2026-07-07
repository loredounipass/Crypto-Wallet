import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.module';

@Injectable()
export class EmailThrottlerGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const email = request.user?.email || request.body?.email?.toString().trim().toLowerCase();
    const path = request.route?.path || request.url;

    // Rate limit GLOBAL por IP
    const isRegister = path?.includes('register');
    const ipLimit = isRegister ? 5 : 60;
    const ipWindow = isRegister ? 60 : 60;
    const ipKey = `rate-limit:ip:${path}:${ip}`;

    try {
      const ipRequests = await this.redisClient.incr(ipKey);
      if (ipRequests === 1) {
        await this.redisClient.expire(ipKey, ipWindow);
      }

      if (ipRequests > ipLimit) {
        const ttl = await this.redisClient.ttl(ipKey);
        const remainingSeconds = ttl > 0 ? ttl : ipWindow;
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Too many requests from this IP. Please try again later.`,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
    }

    // Rate limit por email
    if (!email) return true;

    const emailKey = `rate-limit:email:${path}:${email}`;
    const limit = 10;
    const windowSeconds = 900;

    try {
      const currentRequests = await this.redisClient.incr(emailKey);
      if (currentRequests === 1) {
        await this.redisClient.expire(emailKey, windowSeconds);
      }

      const ttl = await this.redisClient.ttl(emailKey);

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
