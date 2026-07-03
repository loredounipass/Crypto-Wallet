import { get, patch, languagesApi, userLanguageApi } from '../api/http';

export default class LanguagesService {
    static async getLanguage(lang) {
        return await get(`${languagesApi}/${lang}`);
    }

    static async getAllLanguages() {
        return await get(languagesApi);
    }

    static async getUserLanguage() {
        return await get(userLanguageApi);
    }

    static async updateUserLanguage(language) {
        return await patch(userLanguageApi, { language });
    }
}
