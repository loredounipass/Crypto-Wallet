import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NewsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://min-api.cryptocompare.com/data/v2';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CRYPTOCOMPARE_API_KEY') || '';
  }

  /**
   * Fetch news from CryptoCompare.
   * @param lang     Language code (default 'ES')
   * @param categories Comma-separated category filter (e.g. 'BTC,ETH')
   * @param sortOrder  'latest' | 'popular' (default 'latest')
   */
  async getNews(lang = 'ES', categories?: string, sortOrder = 'latest') {
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
   * Fetch available categories and feeds from CryptoCompare.
   */
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
