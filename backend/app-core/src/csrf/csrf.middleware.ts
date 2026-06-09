import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { csrfSynchronisedProtection } from './csrf.config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    csrfSynchronisedProtection(req, res, next);
  }
}
