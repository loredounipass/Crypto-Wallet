import { useState, useEffect, useCallback } from 'react';
import News from '../services/news';

/**
 * Hook para consumir noticias de CryptoCompare.
 * @param {Object} options
 * @param {string} [options.lang]       - Idioma ('ES' por defecto en el backend)
 * @param {string} [options.categories] - Categorías separadas por coma
 * @param {string} [options.sortOrder]  - 'latest' | 'popular'
 */
export default function useNews(options = {}) {
    const { lang, categories, sortOrder } = options;
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await News.getNews({ lang, categories, sortOrder });
            setNews(data?.Data || []);
        } catch (err) {
            setError(err.message || 'Error al cargar noticias');
        } finally {
            setLoading(false);
        }
    }, [lang, categories, sortOrder]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    return { news, loading, error, refetch: fetchNews };
}

