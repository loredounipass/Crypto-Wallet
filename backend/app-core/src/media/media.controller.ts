import { Controller, Get, Req, Res, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { join, resolve } from 'path';
import * as fs from 'fs';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('uploads')
export class MediaController {
  @UseGuards(AuthenticatedGuard)
  @Get('*')
  async serveMedia(@Req() req: Request, @Res() res: Response) {
    const uploadsDir = resolve(process.cwd(), 'uploads');
    // Extract path after /uploads/ from the URL
    const urlPath = req.path.replace(/^\/uploads\//, '');
    const fullPath = resolve(uploadsDir, urlPath);

    // Prevent path traversal
    if (!fullPath.startsWith(uploadsDir)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(fullPath);
  }
}

