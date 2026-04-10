import { MOCK_PRICES, MOCK_YIELDS } from "../data/mockData";

export function getMockYield(ticker) {
  return MOCK_YIELDS[ticker.toUpperCase()] || MOCK_YIELDS.DEFAULT;
}

export function getMockPrice(ticker) {
  return MOCK_PRICES[ticker.toUpperCase()] || MOCK_PRICES.DEFAULT;
}

export function mapHoldingFromApi(item) {
  return {
    id: String(item.id),
    ticker: item.ticker,
    shares: Number(item.shares),
    avgPrice: Number(item.avg_price),
    sector: item.sector,
  };
}

export function mapHoldingToApi(holding) {
  return {
    ticker: holding.ticker,
    shares: Number(holding.shares),
    avg_price: Number(holding.avgPrice),
    sector: holding.sector,
  };
}