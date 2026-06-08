import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import { join } from 'path';

import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

import session from 'express-session';
import passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';


// This is the main entry point of the application. It sets up the NestJS application, configures CORS, global prefix, validation pipes, session management with Redis, and initializes Passport for authentication. Finally, it starts the application on the specified port.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy for secure cookies
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Security headers with Helmet
  // crossOriginResourcePolicy must be 'cross-origin' so the frontend (different origin/port)
  // can load static assets (uploaded images) served by this API.
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  
  app.enableCors({
    origin: ['https://legendary-space-engine-qj97q4q9x9qh99q4-3000.app.github.dev'],
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

  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!),
    },
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  await redisClient.connect();

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
      store: new RedisStore({ client: redisClient as any }),
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
