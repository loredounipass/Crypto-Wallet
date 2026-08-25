import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SupportService } from './support.service';
import { ChatQueryDto } from './dto/chat-query.dto';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) {}



    // PROCESA LA CONSULTA DEL USUARIO Y LA ENVIA AL SERVICIO DE INTELIGENCIA ARTIFICIAL PARA OBTENER UNA RESPUESTA
    @UseGuards(AuthenticatedGuard, ThrottlerGuard)
    @Post('chat')
    async chat(@Request() req, @Body() dto: ChatQueryDto) {
        return this.supportService.query(dto, req.user.email);
    }
}
