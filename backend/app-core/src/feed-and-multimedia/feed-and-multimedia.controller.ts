import { Body, Controller, Get, Post, UseGuards, Param, Delete, Put, UseInterceptors, UploadedFiles, BadRequestException, Request, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FeedPostsService } from './services/feed-posts.service';
import { FeedCommentsService } from './services/feed-comments.service';
import { FeedInteractionsService } from './services/feed-interactions.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { EmailThrottlerGuard } from 'src/guard/auth/email-throttler.guard';

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

@Controller('feed')
export class FeedAndMultimediaController {
  constructor(
    private readonly feedPostsService: FeedPostsService,
    private readonly feedCommentsService: FeedCommentsService,
    private readonly feedInteractionsService: FeedInteractionsService,
  ) {}



  // RECIBE LOS DATOS DEL CLIENTE PARA CREAR UNA NUEVA PUBLICACION EN EL FEED PRINCIPAL
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post()
  async create(@Body() dto: CreatePostDto, @Request() req) {
    return this.feedPostsService.createPost(dto, req.user._id.toString());
  }



  // PROCESA LA CREACION DE UNA PUBLICACION QUE INCLUYE HASTA 10 IMAGENES (CARRUSEL).
  // ACEPTA 'files' (NUEVO) Y 'file' (LEGACY DE UNA SOLA FOTO).
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @UseInterceptors(FileFieldsInterceptor(
    [
      { name: 'files', maxCount: 10 },
      { name: 'file', maxCount: 1 },
    ],
    { limits: { fileSize: 15 * 1024 * 1024 } },
  ))
  @Post('upload')
  async createWithFile(
    @UploadedFiles() files: { files?: MulterFile[]; file?: MulterFile[] },
    @Body() body: any,
    @Request() req,
  ) {
    const list = [...(files?.files || []), ...(files?.file || [])].slice(0, 10);
    return this.feedPostsService.createPostWithFiles(list, body, req.user._id.toString());
  }



  // RECUPERA LA LISTA GLOBAL DE PUBLICACIONES MAS RECIENTES CON PAGINACION CURSOR-BASED
  @UseGuards(AuthenticatedGuard)
  @Get()
  async getFeed(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    const parsedLimit = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 50);
    return this.feedPostsService.getFeed(parsedLimit, cursor);
  }



  // BUSCA UNA PUBLICACION ESPECIFICA POR SU IDENTIFICADOR Y DEVUELVE TODOS SUS DETALLES INCLUYENDO ESTADISTICAS
  @UseGuards(AuthenticatedGuard)
  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.feedPostsService.getPostById(id);
  }



  // PERMITE AL AUTOR ORIGINAL MODIFICAR LOS DATOS DE SU PUBLICACION COMO LA DESCRIPCION O EL ARCHIVO ADJUNTO
  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.feedPostsService.updatePost(id, body, req.user._id.toString());
  }



  // ELIMINA DEFINITIVAMENTE UNA PUBLICACION JUNTO CON TODOS SUS COMENTARIOS Y ARCHIVOS MULTIMEDIA ASOCIADOS
  @UseGuards(AuthenticatedGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.feedPostsService.deletePost(id, req.user._id.toString());
  }



  // AÑADE UN NUEVO COMENTARIO O RESPUESTA A UNA PUBLICACION EXISTENTE EN EL SISTEMA
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() body: any, @Request() req) {
    const dto: CreateCommentDto = {
      content: body.content,
      postId: id,
      authorId: req.user._id.toString(),
      parentId: body.parentId,
    } as CreateCommentDto;
    return this.feedCommentsService.addComment(dto, req.user._id.toString());
  }



  // OBTIENE TODOS LOS COMENTARIOS ASOCIADOS A UNA PUBLICACION JUNTO CON LA INFORMACION DE SUS AUTORES
  @UseGuards(AuthenticatedGuard)
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.feedCommentsService.getCommentsForPost(id);
  }



  // ELIMINA UN COMENTARIO ESPECIFICO SIEMPRE Y CUANDO EL USUARIO QUE LO SOLICITA SEA EL AUTOR DEL MISMO
  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req) {
    return this.feedCommentsService.deleteComment(commentId, req.user._id.toString());
  }



  // REGISTRA UN ME GUSTA DE UN USUARIO SOBRE UN COMENTARIO Y ACTUALIZA EL CONTADOR CORRESPONDIENTE
  @UseGuards(AuthenticatedGuard)
  @Post('comments/:commentId/likes')
  async likeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.feedCommentsService.likeComment(commentId, req.user._id.toString());
  }



  // ELIMINA EL ME GUSTA PREVIO DE UN USUARIO SOBRE UN COMENTARIO DECREMENTANDO EL CONTADOR TOTAL
  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId/likes')
  async unlikeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.feedCommentsService.unlikeComment(commentId, req.user._id.toString());
  }



  // REGISTRA UN ME GUSTA DIRECTAMENTE EN UNA PUBLICACION Y ACTUALIZA LAS ESTADISTICAS DEL POST
  @UseGuards(AuthenticatedGuard)
  @Post(':id/likes')
  async addLike(@Param('id') id: string, @Request() req) {
    return this.feedInteractionsService.likePost(id, req.user._id.toString());
  }



  // RETIRA EL ME GUSTA DE UNA PUBLICACION Y ACTUALIZA LAS ESTADISTICAS REFLEJANDO EL CAMBIO
  @UseGuards(AuthenticatedGuard)
  @Delete(':id/likes')
  async removeLike(@Param('id') id: string, @Request() req) {
    return this.feedInteractionsService.unlikePost(id, req.user._id.toString());
  }



  // INCREMENTA EL CONTADOR DE VISUALIZACIONES DE UNA PUBLICACION ASEGURANDO QUE NO SE REPITA EN LA MISMA SESION
  @UseGuards(AuthenticatedGuard)
  @Post(':id/views')
  async addView(@Param('id') id: string, @Request() req) {
    const sess: any = req.session || {};
    sess.viewedPosts = sess.viewedPosts || {};
    if (sess.viewedPosts[id]) {
      return this.feedPostsService.getPostById(id);
    }
    try {
      sess.viewedPosts[id] = Date.now();
      req.session = sess;
    } catch (_) {}
    return this.feedInteractionsService.incrementView(id, req.user._id.toString());
  }



  // AUMENTA EN UNO EL CONTADOR DE VECES QUE SE HA COMPARTIDO UNA PUBLICACION DENTRO O FUERA DE LA PLATAFORMA
  @UseGuards(AuthenticatedGuard)
  @Post(':id/shares')
  async addShare(@Param('id') id: string, @Request() req) {
    return this.feedInteractionsService.incrementShare(id, req.user._id.toString());
  }
}
