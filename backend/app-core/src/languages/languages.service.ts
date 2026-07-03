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
    const candidates = [
      path.join(__dirname, '..', '..', 'languages'),
      path.join(process.cwd(), 'languages'),
      path.join(process.cwd(), 'backend', 'app-core', 'languages'),
    ];
    this.languagesPath = candidates.find(p => fs.existsSync(p)) || candidates[0];
  }

  async onModuleInit() {
    const count = await this.languageModel.countDocuments().exec();
    if (count === 0) {
      await this.languageModel.insertMany([
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
      ]);
    }
  }

  async getAllLanguages(userLang?: string): Promise<any[]> {
    const languages = await this.languageModel.find().lean().exec();
    if (!languages || languages.length === 0) {
      return [
        { code: 'en', name: 'English', nativeName: 'English', active: userLang === 'en' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', active: userLang === 'es' || !userLang },
      ];
    }
    return languages.map(lang => ({
      ...lang,
      active: lang.code === (userLang || 'es'),
    }));
  }

  getLanguageTranslations(lang: string): any {
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
