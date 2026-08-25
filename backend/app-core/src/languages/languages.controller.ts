import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { LanguagesService } from './languages.service';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}



  // OBTIENE LA LISTA COMPLETA DE IDIOMAS SOPORTADOS POR EL SISTEMA E INDICA CUAL ES EL ACTIVO PARA EL USUARIO
  @Get()
  async getAllLanguages(@Request() req) {
    const userLang = req.user?.language;
    return this.languagesService.getAllLanguages(userLang);
  }



  // RECUPERA EL DICCIONARIO COMPLETO DE TRADUCCIONES PARA UN IDIOMA ESPECIFICO SEGUN SU CODIGO ISO
  @Get(':lang')
  getLanguage(@Param('lang') lang: string) {
    return this.languagesService.getLanguageTranslations(lang);
  }
}
