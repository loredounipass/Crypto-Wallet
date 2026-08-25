import { Controller, UseGuards, Get, Post, Body, UseInterceptors, UploadedFile, Param, Query } from '@nestjs/common';
import { Public } from '../guard/auth/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { CurrentUser } from 'src/guard/auth/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}



  // OBTIENE LA INFORMACION COMPLETA DEL PERFIL PERTENECIENTE AL USUARIO ACTUALMENTE AUTENTICADO
  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.service.getByOwner(user._id.toString());
  }



  // RECUPERA LOS DATOS PUBLICOS DE CUALQUIER PERFIL MEDIANTE SU IDENTIFICADOR PARA MOSTRARLOS A OTROS USUARIOS
  @Public()
  @Get(':id')
  async getProfileById(@Param('id') id: string) {
    return this.service.getPublicById(id);
  }



  // ACTUALIZA LA INFORMACION DEL PERFIL DEL USUARIO O LO CREA SI ES LA PRIMERA VEZ QUE SE MODIFICA
  @UseGuards(AuthenticatedGuard)
  @Post()
  async upsert(@Body() dto: UpdateProfileDto, @CurrentUser() user: any) {
    return this.service.upsert(user._id.toString(), dto);
  }



  // PROCESA LA SUBIDA DE UNA NUEVA FOTO DE PERFIL OPTIMIZANDO LA IMAGEN Y GENERANDO SU MINIATURA
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @Post('upload/profile-photo')
  async uploadProfilePhoto(@UploadedFile() file: MulterFile, @CurrentUser() user: any) {
    return this.service.uploadImage(user._id.toString(), file, 'profile');
  }



  // RECUPERA LA LISTA DE PUBLICACIONES MULTIMEDIA ASOCIADAS AL PERFIL PARA MOSTRARLAS EN SU MURO PUBLICO
  @Public()
  @Get(':id/posts')
  async getPostsByProfile(@Param('id') id: string, @Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    return this.service.getPostsForProfile(id, l);
  }
}

export default {};
