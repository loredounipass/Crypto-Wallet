import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @UseGuards(AuthenticatedGuard)
  async getAllLanguages(@Request() req) {
    const userLang = req.user?.language;
    return this.languagesService.getAllLanguages(userLang);
  }

  @Get(':lang')
  getLanguage(@Param('lang') lang: string) {
    return this.languagesService.getLanguageTranslations(lang);
  }
}
