import { Controller, UseGuards, Get, Post, Delete, Body, UseInterceptors, UploadedFile, Param, Query } from '@nestjs/common';
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


  // PROCESA LA SUBIDA DE UNA NUEVA FOTO DE PORTADA OPTIMIZANDO LA IMAGEN Y GENERANDO SU MINIATURA
  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @Post('upload/cover-photo')
  async uploadCoverPhoto(@UploadedFile() file: MulterFile, @CurrentUser() user: any) {
    return this.service.uploadImage(user._id.toString(), file, 'cover');
  }



  // RECUPERA EL PERFIL DEL FORO: IDENTIDAD, BIO, PAIS, MONEDAS, FLAG P2P Y MURO DE POSTS
  @UseGuards(AuthenticatedGuard)
  @Get('forum/:id')
  async getForumProfile(@Param('id') id: string, @Query('limit') limit?: string, @CurrentUser() user?: any) {
    const l = limit ? parseInt(limit, 10) : 20;
    return this.service.getForumProfile(id, l, user?._id?.toString());
  }


  // REGISTRA AL USUARIO ACTUAL COMO SEGUIDOR DEL PERFIL INDICADO
  @UseGuards(AuthenticatedGuard)
  @Post('follow/:id')
  async follow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.follow(user._id.toString(), id);
  }


  // ELIMINA AL USUARIO ACTUAL DE LOS SEGUIDORES DEL PERFIL INDICADO
  @UseGuards(AuthenticatedGuard)
  @Delete('follow/:id')
  async unfollow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unfollow(user._id.toString(), id);
  }


  // DEVUELVE EL ESTADO DE SEGUIMIENTO Y CONTEOS ENTRE EL USUARIO ACTUAL Y EL PERFIL
  @UseGuards(AuthenticatedGuard)
  @Get('follow/:id/state')
  async followState(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getFollowState(user._id.toString(), id);
  }


  // RECUPERA LA LISTA DE PUBLICACIONES MULTIMEDIA ASOCIADAS AL PERFIL PARA MOSTRARLAS EN SU MURO PUBLICO
  @UseGuards(AuthenticatedGuard)
  @Get(':id/posts')
  async getPostsByProfile(@Param('id') id: string, @Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    return this.service.getPostsByAuthor(id, l);
  }
}

export default {};
