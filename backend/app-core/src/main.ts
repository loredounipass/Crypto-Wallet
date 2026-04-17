import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import { join } from 'path';

import * as connectRedis from 'connect-redis';
import Redis from 'ioredis'

import * as session from 'express-session';
import * as passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import { csrfSync } from 'csrf-sync';
import helmet from 'helmet';


// This is the main entry point of the application. It sets up the NestJS application, configures CORS, global prefix, validation pipes, session management with Redis, and initializes Passport for authentication. Finally, it starts the application on the specified port.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(helmet());
  
  app.enableCors({
    origin: ['http://localhost:3000'],
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

  // CSRF - only protect state-changing operations (POST, PUT, DELETE, PATCH)
  const { csrfSynchronisedProtection, generateToken } = csrfSync({
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  // CSRF token endpoint (before global prefix)
  app.use('/csrf-token', (req: any, res: any) => {
    const csrfToken = generateToken(req);
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });
    res.json({ csrfToken });
  });
  
  // Skip CSRF for specific routes that need it (login, register, etc.)
  const csrfMiddleware = (req: any, res: any, next: any) => {
    // Skip for GET requests (safe)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip for specific public endpoints (includes /secure/api prefix!)
    // Use startsWith to handle paths with query strings or trailing slashes
    const skipPaths = [
      '/csrf-token',
      '/secure/api/csrf-token',
      '/secure/api/user/login', 
      '/secure/api/user/update-profile',
      '/secure/api/user/register', 
      '/secure/api/user/resend-token', 
      '/secure/api/user/forgot-password', 
      '/secure/api/user/reset-password',
      '/secure/api/user/verify-token',
      '/secure/api/user/logout',
      '/secure/api/user/update-token-status',
      '/secure/api/profile',
      '/secure/api/wallet',
      '/secure/api/escrow'
    ];
    const shouldSkip = skipPaths.some(p => req.path.startsWith(p));
    if (shouldSkip) {
      return next();
    }
    
    // Apply CSRF protection for other state-changing requests
    return csrfSynchronisedProtection(req, res, next);
  };
  
  app.use(csrfMiddleware);

  // Serve uploaded files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(parseInt(process.env.PORT!));
}
bootstrap();
