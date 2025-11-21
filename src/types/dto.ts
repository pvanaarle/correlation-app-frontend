export interface HelloWorldDto {
  name: string;
}

// Asset zoals de backend 'm teruggeeft (AssetDto)
export interface AssetDto {
    id: number;
    symbol: string; // bv. "BTC/USD" of AAPL
    name: string;   // bv. "Bitcoin" of "Apple"
    type: string;   // bv. "Crypto" of "Stock"
}

// Eén datapunt in de time series (PricePointDto)
export interface PricePointDto {
    datetime: string; // ISO-string uit Spring (we maken er in React weer een Date van)
    close: number;    // BigDecimal → JSON number
}
