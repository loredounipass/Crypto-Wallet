import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { LanguagesService } from './languages.service';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  async getAllLanguages(@Request() req) {
    const userLang = req.user?.language;
    return this.languagesService.getAllLanguages(userLang);
  }

  @Get(':lang')
  getLanguage(@Param('lang') lang: string) {
    return this.languagesService.getLanguageTranslations(lang);
  }
}
