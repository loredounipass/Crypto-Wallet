import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../guard/auth/public.decorator';
import { PriceService } from './price.service';

@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}



  // CARGA LOS PRECIOS Y PORCENTAJES DE CAMBIO DE LAS MONEDAS PRINCIPALES PARA LA LANDING
  // IMPORTANTE: LAS RUTAS ESTATICAS DEBEN DECLARARSE ANTES QUE LAS RUTAS CON PARAMETROS.
  @Public()
  @Get('landing')
  async getLandingPrices() {
    return this.priceService.getLanding();
  }



  // DEVUELVE EL HISTORIAL DE PRECIOS DE LAS ULTIMAS 24 HORAS PARA DIBUJAR LA GRAFICA
  @Public()
  @Get(':coin/chart')
  async getChart(@Param('coin') coin: string) {
    return this.priceService.getChart(coin);
  }



  // DEVUELVE EL PRECIO ACTUAL EN USD DE UNA MONEDA
  @Public()
  @Get(':coin')
  async getPrice(@Param('coin') coin: string) {
    return this.priceService.getPrice(coin);
  }
}
