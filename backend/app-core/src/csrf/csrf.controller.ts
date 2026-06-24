import { Controller, Get, Req } from '@nestjs/common';
import { Public } from '../guard/auth/public.decorator';
import type { Request } from 'express';
import { generateToken } from './csrf.config';

@Controller()
export class CsrfController {
  @Public()
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    return { csrfToken: generateToken(req) };
  }
}
