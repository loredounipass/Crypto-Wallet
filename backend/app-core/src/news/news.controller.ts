// import { Controller, Get, Query } from '@nestjs/common';
// import { Public } from '../guard/auth/public.decorator';
// import { NewsService } from './news.service';

// @Controller('news')
// export class NewsController {
//   constructor(private readonly newsService: NewsService) {}

//   /**
//    * GET /news
//    * Proxy para las noticias de CryptoCompare.
//    * Query params opcionales:
//    *   - lang       (default 'ES')
//    *   - categories (comma-separated, e.g. 'BTC,ETH')
//    *   - sortOrder  ('latest' | 'popular', default 'latest')
//    */
//   @Public()
//   @Get()
//   async getNews(
//     @Query('lang') lang = 'ES',
//     @Query('categories') categories?: string,
//     @Query('sortOrder') sortOrder = 'latest',
//   ) {
//     return this.newsService.getNews(lang, categories, sortOrder);
//   }

//   /**
//    * GET /news/categories
//    * Devuelve las categorías y feeds disponibles.
//    */
//   @Public()
//   @Get('categories')
//   async getCategories() {
//     return this.newsService.getCategories();
//   }
// }
