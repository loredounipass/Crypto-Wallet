import { get, newsApi, newsCategoriesApi } from '../api/http';

export default class News {
    /**
     * Obtiene las noticias de CryptoCompare.
     * @param {Object} params - Parámetros opcionales
     * @param {string} [params.lang='ES'] - Idioma
     * @param {string} [params.categories] - Categorías separadas por coma
     * @param {string} [params.sortOrder='latest'] - Orden
     */
    static async getNews(params = {}) {
        return get(newsApi, params);
    }

    /**
     * Obtiene las categorías disponibles de noticias.
     */
    static async getCategories() {
        return get(newsCategoriesApi);
    }
}
