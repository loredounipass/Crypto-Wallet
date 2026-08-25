import { Controller, Get, Req, Res, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { join, resolve } from 'path';
import * as fs from 'fs';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('uploads')
export class MediaController {



  // RECUPERA UN ARCHIVO MULTIMEDIA DE FORMA SEGURA VERIFICANDO QUE EL USUARIO TENGA ACCESO Y EL ARCHIVO EXISTA
  @UseGuards(AuthenticatedGuard)
  @Get('*')
  async serveMedia(@Req() req: Request, @Res() res: Response) {
    const uploadsDir = resolve(process.cwd(), 'uploads');
    const urlPath = req.path.replace(/^\/uploads\//, '');
    const fullPath = resolve(uploadsDir, urlPath);
    if (!fullPath.startsWith(uploadsDir)) {
      throw new BadRequestException('Invalid file path');
    }
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(fullPath);
  }
}
