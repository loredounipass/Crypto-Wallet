import { get, patch, languagesApi, userLanguageApi } from '../api/http';

export default class LanguagesService {



    // FETCHES THE TRANSLATION DICTIONARY FOR A SPECIFIC LANGUAGE CODE
    static async getLanguage(lang) {
        return await get(`${languagesApi}/${lang}`);
    }




    // FETCHES THE LIST OF ALL AVAILABLE LANGUAGES SUPPORTED BY THE SYSTEM
    static async getAllLanguages() {
        return await get(languagesApi);
    }




    // FETCHES THE CURRENTLY SELECTED LANGUAGE PREFERENCE FOR THE LOGGED IN USER
    static async getUserLanguage() {
        return await get(userLanguageApi);
    }




    // UPDATES THE USER'S PREFERRED LANGUAGE SETTING ON THE BACKEND
    static async updateUserLanguage(language) {
        return await patch(userLanguageApi, { language });
    }
}
