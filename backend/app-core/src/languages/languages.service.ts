import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Language, LanguageDocument } from './schemas/language.schema';

@Injectable()
export class LanguagesService implements OnModuleInit {
  private readonly languagesPath: string;

  constructor(
    @InjectModel(Language.name) private languageModel: Model<LanguageDocument>,
  ) {
    this.languagesPath = path.join(__dirname, 'data');
  }

  async onModuleInit() {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    ];
    for (const lang of languages) {
      await this.languageModel.updateOne(
        { code: lang.code },
        { $setOnInsert: lang },
        { upsert: true },
      );
    }
  }

  async getAllLanguages(userLang?: string): Promise<any[]> {
    let languages: any[] = await this.languageModel.find().lean().exec();
    if (!languages || languages.length === 0) {
      languages = [];
    }
    const defaultLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    ];
    const existingCodes = new Set(languages.map(l => l.code));
    for (const lang of defaultLanguages) {
      if (!existingCodes.has(lang.code)) {
        languages.push(lang);
        try {
          await this.languageModel.updateOne(
            { code: lang.code },
            { $setOnInsert: lang },
            { upsert: true },
          );
        } catch {}
      }
    }
    return languages.map(lang => ({
      ...lang,
      active: lang.code === (userLang || 'es'),
    }));
  }

  getLanguageTranslations(lang: string): any {
    if (!/^[a-zA-Z0-9_-]+$/.test(lang)) {
      throw new NotFoundException(`Invalid language code: '${lang}'`);
    }
    try {
      const filePath = path.join(this.languagesPath, `${lang}.json`);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`Language file for '${lang}' not found`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return { data, lang, active: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Could not load translations for '${lang}'`);
    }
  }
}
