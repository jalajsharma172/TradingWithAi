import { preProcessFile } from "typescript";
import type { Candlestick } from "./lighter-sdk-ts/generated";
import { indexOfLine } from "bun";

export function getEMA2(price:number[],period:number):number[] {

    // 1st EMA
    const smaInterval=price.length-period;
    if(smaInterval<1){
        throw new Error("Not enough error provided");
        return [];
    }
    const multiplier=2/(period+1);
    let sma=0;
    for(let i=0;i<smaInterval;i++){
        sma+=(price[i] ?? 0);
    }
    sma/=smaInterval;
    
    const emas=[Number(sma.toFixed(3))];
    console.log("First EMA ",emas);
    
    for(let i=period;i<period;i++){
        const ema=Number(((emas[emas.length-1] ?? 0) *(1-multiplier) + (price[smaInterval + i ] ?? 0)*multiplier).toFixed(3));
        emas.push(ema);
    }
    return emas;
}

export function getMidPrices(candlesticks: Candlestick[]): number[] {
    return candlesticks
        .map(({ open, close }) => Number(((open + close) / 2).toFixed(3)));
}
  
// macd= ema26-ema 14
export function getMACD(candles: number[]) {
    const ema26 = getEMA2(candles, 26);
    const ema12 = getEMA2(candles, 12);
    
    const macd =ema26.slice(-14).map((_,index)=>(ema26[index]??0) - (ema12[index]??0));
    return macd;
  }



export function getSMA(candles: number[], period: number) {
    if (candles.length < period) {
      throw new Error("Not enough candles for SMA");
    }
  
    const smaValues: number[] = [];
    for (let i = 0; i <= candles.length - period; i++) {
      const slice = candles.slice(i, i + period);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      smaValues.push(Number(avg.toFixed(2)));
    }
  
    return smaValues;
  }
  

  export function getEMA(candles: number[], period: number) {
    if (candles.length < period) {
      throw new Error("Not enough candles to compute EMA");
    }
  
    const k = 2 / (period + 1);
  
    // FIRST EMA = SMA of first N candles
    let emaPrev =
      candles.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
    const emaValues: number[] = [];
    emaValues.push(Number(emaPrev.toFixed(2)));
  
    // Continue EMA
    for (let i = period; i < candles.length; i++) {
      const price = (candles[i] ?? 0);
      const ema = price * k + emaPrev * (1 - k);
      emaValues.push(Number(ema.toFixed(2)));
      emaPrev = ema;
    }
  
    return emaValues;
  }
  

  export function getRSI(candles: number[], period = 14) {
    if (candles.length < period + 1) {
      throw new Error("Not enough candles for RSI");
    }
  
    const deltas = candles.slice(1).map((c, i) => c - (candles[i] ?? 0));
  
    let gains = 0, losses = 0;
    for (let i = 0; i < period; i++) {
      if ((deltas[i] ?? 0) > 0) gains += (deltas[i] ?? 0);
      else losses -= (deltas[i] ?? 0);
    }
  
    gains /= period;
    losses /= period;
  
    const rsiValues: number[] = [];
    let rs = losses === 0 ? 100 : gains / losses;
    rsiValues.push(Number((100 - 100 / (1 + rs)).toFixed(2)));
  
    for (let i = period; i < deltas.length; i++) {
      const delta = (deltas[i] ?? 0);
      gains = (gains * (period - 1) + (delta > 0 ? delta : 0)) / period;
      losses = (losses * (period - 1) + (delta < 0 ? -delta : 0)) / period;
  
      rs = losses === 0 ? 100 : gains / losses;
  
      const rsi = 100 - 100 / (1 + rs);
      rsiValues.push(Number(rsi.toFixed(2)));
    }
  
    return rsiValues;
  }
  


  export function getBollingerBands(candles: number[], period = 20) {
    if (candles.length < period) {
      throw new Error("Not enough candles for Bollinger Bands");
    }
  
    const sma = getSMA(candles, period);
    const bands = sma.map((avg, i) => {
      const slice = candles.slice(i, i + period);
      const mean = avg;
  
      const variance =
        slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
  
      const std = Math.sqrt(variance);
  
      return {
        upper: Number((mean + 2 * std).toFixed(2)),
        middle: Number(mean.toFixed(2)),
        lower: Number((mean - 2 * std).toFixed(2)),
      };
    });
  
    return bands;
  }
  
  
  
  // ================================
  // ATR (Average True Range)
  // ================================
//   export function getATR(
//     high: number[],
//     low: number[],
//     close: number[],
//     period = 14
//   ) {
//     const tr: number[] = [];
  
//     for (let i = 1; i < high.length; i++) {
//       const v1 = (high[i] ?? 0) - (low[i] ?? 0);
//       const v2 = Math.abs(high[i] - close[i - 1]);
//       const v3 = Math.abs(low[i] - close[i - 1]);
  
//       tr.push(Math.max(v1, v2, v3));
//     }
  
//     return getEMA(tr, period);
//   }
  
  
  
  // ================================
  // SuperTrend
  // ================================
//   export function getSuperTrend(
//     high: number[],
//     low: number[],
//     close: number[],
//     period = 10,
//     multiplier = 3
//   ) {
//     const atr = getATR(high, low, close, period);
//     const st: number[] = [];
  
//     for (let i = 0; i < atr.length; i++) {
//       const mid = (high[i + period] + low[i + period]) / 2;
//       const upper = mid + atr[i] * multiplier;
//       const lower = mid - atr[i] * multiplier;
//       st.push(Number(lower.toFixed(2))); // Basic trend line
//     }
  
//     return st;
//   }
  