import { Controller, Get, Query } from '@nestjs/common';

@Controller('news')
export class NewsController {
  private readonly apiKey = process.env.CRYPTOCOMPARE_API_KEY || '';
  private readonly baseUrl = 'https://min-api.cryptocompare.com/data/v2';

  /**
   * GET /news
   * Proxy para las noticias de CryptoCompare.
   * Query params opcionales:
   *   - lang       (default 'ES')
   *   - categories (comma-separated, e.g. 'BTC,ETH')
   *   - sortOrder  ('latest' | 'popular', default 'latest')
   */
  @Get()
  async getNews(
    @Query('lang') lang = 'ES',
    @Query('categories') categories?: string,
    @Query('sortOrder') sortOrder = 'latest',
  ) {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      lang,
      sortOrder,
    });

    if (categories) {
      params.set('categories', categories);
    }

    const res = await fetch(`${this.baseUrl}/news/?${params.toString()}`);

    if (!res.ok) {
      return { Data: [], Message: 'Error fetching news' };
    }

    return res.json();
  }

  /**
   * GET /news/categories
   * Devuelve las categorías y feeds disponibles.
   */
  @Get('categories')
  async getCategories() {
    const res = await fetch(
      `${this.baseUrl}/news/feeds-and-categories?api_key=${this.apiKey}`,
    );

    if (!res.ok) {
      return { Categories: {}, Feeds: [] };
    }

    return res.json();
  }
}
