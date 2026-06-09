import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { generateToken } from './csrf.config';

@Controller()
export class CsrfController {
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    return { csrfToken: generateToken(req) };
  }
}
