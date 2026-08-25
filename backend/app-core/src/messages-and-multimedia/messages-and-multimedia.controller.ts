import { Body, Controller, Get, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesAndMultimediaService } from './messages-and-multimedia.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { CurrentUser } from 'src/guard/auth/current-user.decorator';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Controller('messages')
export class MessagesAndMultimediaController {
  constructor(private readonly service: MessagesAndMultimediaService) {}



  // ENVIA UN MENSAJE DE TEXTO DIRECTO A OTRO USUARIO DE LA PLATAFORMA
  @UseGuards(AuthenticatedGuard)
  @Post()
  async create(@Body() dto: CreateMessageDto, @CurrentUser() user: any) {
    return this.service.createMessage(dto, user._id.toString());
  }



  // PROCESA EL ENVIO DE UN MENSAJE QUE INCLUYE UN ARCHIVO ADJUNTO DE IMAGEN O VIDEO HASTA UN MAXIMO DE 250MB
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 250 * 1024 * 1024 } }))
  @Post('upload')
  async createWithFile(@UploadedFile() file: MulterFile, @Body() body: any, @CurrentUser() user: any) {
    const dto: CreateMessageDto = {
      content: body.content || '',
      type: body.type || ('image' as any),
      receiverId: body.receiverId,
      multimediaId: undefined,
      senderId: user._id.toString(),
    } as CreateMessageDto;
    return this.service.createMessageWithFile(file, dto, user._id.toString());
  }



  // OBTIENE EL HISTORIAL COMPLETO DE CONVERSACIONES DEL USUARIO ACTUAL ORDENADO CRONOLOGICAMENTE
  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getMyMessages(@CurrentUser() user: any) {
    return this.service.getMessagesByUser(user._id.toString());
  }
}
