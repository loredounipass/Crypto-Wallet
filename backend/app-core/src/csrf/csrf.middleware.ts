import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { csrfSync } from 'csrf-sync';

const AUTH_PATHS = [
  '/secure/api/user/login',
  '/secure/api/user/register',
  '/secure/api/user/forgot-password',
  '/secure/api/user/reset-password',
  '/secure/api/user/resend-token',
  '/secure/api/user/verify-token',
];

const { csrfSynchronisedProtection } = csrfSync({
  skipCsrfProtection: (req) => {
    return AUTH_PATHS.includes(req.path) || req.path === '/csrf-token';
  },
});

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    csrfSynchronisedProtection(req, res, next);
  }
}
