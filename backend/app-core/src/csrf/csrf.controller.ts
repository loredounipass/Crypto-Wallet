import { Controller, Get, Req } from '@nestjs/common';
import { csrfSync } from 'csrf-sync';
import type { Request } from 'express';

const { generateToken } = csrfSync();

@Controller()
export class CsrfController {
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    return { csrfToken: generateToken(req) };
  }
}
