import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import { join } from 'path';

import * as connectRedis from 'connect-redis';
import Redis from 'ioredis'

import * as session from 'express-session';
import * as passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';


// This is the main entry point of the application. It sets up the NestJS application, configures CORS, global prefix, validation pipes, session management with Redis, and initializes Passport for authentication. Finally, it starts the application on the specified port.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(helmet());
  
  app.enableCors({
    origin: ['https://sturdy-space-fishstick-76rv959r4gpfrxqg-3000.app.github.dev'],
    credentials: true
  })


  // Set a global prefix for all routes
  app.setGlobalPrefix('secure/api', {
    exclude: ['/csrf-token', ''],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  

  // Configure session management using Redis as the session store
  const RedisStore = connectRedis.default || connectRedis;
  const RedisStoreClass = RedisStore(session);
  const redisClient = new Redis({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[Redis] Retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const sessionCookie = {
    maxAge: parseInt(process.env.EXPIRE_IN!),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  };

  app.use(
    session({
      store: new RedisStoreClass({ client: redisClient as any }),
      secret: process.env.TOKEN_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: sessionCookie
    })
  );

  // Initialize Passport before CSRF
  app.use(passport.initialize());
  app.use(passport.session());

  // Serve uploaded files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(parseInt(process.env.PORT!));
}
bootstrap();
