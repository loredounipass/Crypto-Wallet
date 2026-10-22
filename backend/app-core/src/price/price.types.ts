// RESPUESTA PUBLICA DEL ENDPOINT /price/:coin
export interface PriceResponse {
  USD: number;
}

// RESPUESTA PUBLICA DEL ENDPOINT /price/:coin/chart
export interface ChartResponse {
  prices: number[];
}

// ENTRADA DE COINGECKO PARA /simple/price
export interface SimplePriceEntry {
  usd: number;
  usd_24h_change?: number;
}

// MAPA CRUDO DEVUELTO POR COINGECKO EN /simple/price
export type SimplePriceResponse = Record<string, SimplePriceEntry>;

// RESPUESTA DE COINGECKO PARA /coins/:id/market_chart
export interface MarketChartResponse {
  prices: Array<[number, number]>;
}

// RESPUESTA CRUDA DEL ENDPOINT /price/landing (CONTRATO HISTORICO)
export type LandingPrices = SimplePriceResponse;
