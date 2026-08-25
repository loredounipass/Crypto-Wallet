import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import * as fs from 'fs';
import { join, resolve } from 'path';

import { RedisStore } from 'connect-redis';

import session from 'express-session';
import passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import { REDIS_CLIENT } from './redis/redis.module';
import { RedisIoAdapter } from './redis/redis-io.adapter';
import { csrfSynchronisedProtection } from './csrf/csrf.config';



// INICIALIZA Y CONFIGURA TODOS LOS SERVICIOS GLOBALES DE LA APLICACION INCLUYENDO SEGURIDAD Y SESIONES
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');
  app.enableCors({
    origin: [process.env.CORS_ORIGIN],
    credentials: true
  });
  app.setGlobalPrefix('secure/api', {
    exclude: ['/csrf-token', ''],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  const redisClient = app.get(REDIS_CLIENT);
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = process.env.SAME_SITE_COOKIE || (isProduction ? 'none' : 'lax');
  const sessionCookie = {
    maxAge: parseInt(process.env.EXPIRE_IN!),
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSite as 'strict' | 'lax' | 'none',
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
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(csrfSynchronisedProtection);
  const uploadsDir = resolve(process.cwd(), 'uploads');
  app.use('/uploads', (req: any, res: any, next: any) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const urlPath = req.path.replace(/^\//, '');
    const fullPath = resolve(uploadsDir, urlPath);
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.sendFile(fullPath);
  });
  await app.listen(parseInt(process.env.PORT!));
}
bootstrap();
