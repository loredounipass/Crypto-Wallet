import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';

describe('PriceController routing', () => {
  let app: INestApplication;
  const priceService = {
    getPrice: jest.fn(),
    getChart: jest.fn(),
    getLanding: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PriceController],
      providers: [{ provide: PriceService, useValue: priceService }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('/price/landing usa la ruta estatica y no el parametro :coin', async () => {
    priceService.getLanding.mockResolvedValue({ bitcoin: { usd: 60000 } });

    await request(app.getHttpServer())
      .get('/price/landing')
      .expect(200)
      .expect({ bitcoin: { usd: 60000 } });

    expect(priceService.getLanding).toHaveBeenCalledTimes(1);
    expect(priceService.getPrice).not.toHaveBeenCalled();
  });

  it('/price/:coin delega en getPrice', async () => {
    priceService.getPrice.mockResolvedValue({ USD: 2000 });

    await request(app.getHttpServer()).get('/price/eth').expect(200).expect({ USD: 2000 });

    expect(priceService.getPrice).toHaveBeenCalledWith('eth');
  });

  it('/price/:coin/chart delega en getChart', async () => {
    priceService.getChart.mockResolvedValue({ prices: [1, 2] });

    await request(app.getHttpServer())
      .get('/price/eth/chart')
      .expect(200)
      .expect({ prices: [1, 2] });

    expect(priceService.getChart).toHaveBeenCalledWith('eth');
  });
});
