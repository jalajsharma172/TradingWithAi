import type { Candlestick } from "./lighter-sdk-ts/generated";

/*---------------------------------------------------------
   CORRECT EMA IMPLEMENTATION (TRADINGVIEW ACCURATE)
---------------------------------------------------------*/
export function getEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const ema: (number | null)[] = Array(values.length).fill(null);

  if (values.length < period) return ema;

  // First EMA = SMA(period)
  const sma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema[period - 1] = sma;

  // EMA thereafter
  for (let i = period; i < values.length; i++) {
    ema[i] = values[i] * k + (ema[i - 1] as number) * (1 - k);
  }

  return ema;
}

/*---------------------------------------------------------
   MID PRICE = (OPEN + CLOSE) / 2
---------------------------------------------------------*/
export function getMidPrices(candlesticks: Candlestick[]): number[] {
  return candlesticks.map(({ open, close }) =>
    Number(((open + close) / 2).toFixed(3))
  );
}

/*---------------------------------------------------------
   MACD = EMA12 - EMA26 (ALIGNED BY CANDLE INDEX)
---------------------------------------------------------*/
export function getMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = getEMA(prices, fast);
  const emaSlow = getEMA(prices, slow);

  const macdLine = emaFast.map((v, i) =>
    v !== null && emaSlow[i] !== null ? v - emaSlow[i] : null
  );

  const validMACD = macdLine.filter(v => v !== null) as number[];
  const signalShort = getEMA(validMACD, signal);

  const signalLine = Array(prices.length).fill(null);
  let si = 0;

  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] !== null) {
      signalLine[i] = signalShort[si];
      si++;
    }
  }

  const histogram = macdLine.map((m, i) =>
    m !== null && signalLine[i] !== null ? m - signalLine[i] : null
  );

  return { macdLine, signalLine, histogram };
}

/*---------------------------------------------------------
   MACD + SIGNAL + HISTOGRAM (TRADINGVIEW MATCHING)
---------------------------------------------------------*/
export function getMACDFull(candles: number[]) {
  const ema12 = getEMA(candles, 12);
  const ema26 = getEMA(candles, 26);

  const macd: (number | null)[] = candles.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null
      ? (ema12[i]! - ema26[i]!)
      : null
  );

  // Signal uses ONLY valid MACD values
  const validMACD = macd.filter(v => v !== null) as number[];
  const signalShort = getEMA(validMACD, 9);

  const signal: (number | null)[] = Array(candles.length).fill(null);

  // Stretch signal into full-length
  let si = 0;
  for (let i = 0; i < candles.length; i++) {
    if (macd[i] !== null) {
      signal[i] = signalShort[si];
      si++;
    }
  }

  // Histogram
  const histogram = macd.map((m, i) =>
    m !== null && signal[i] !== null
      ? (m - signal[i]!)
      : null
  );

  return { macd, signal, histogram };
}


/*---------------------------------------------------------
   If MACD and Signal Line Cross EachOther Then Gives a Alert (TRADINGVIEW MATCHING)
---------------------------------------------------------*/

/*---------------------------------------------------------
   MACD / Signal Crossover Alerts (TRADINGVIEW MATCHING)
---------------------------------------------------------*/

export function detectMACDCrossovers(macd: number[], signal: number[]) {
  const alerts: any[] = [];

  for (let i = 1; i < macd.length; i++) {
    const prevM = macd[i - 1];
    const prevS = signal[i - 1];
    const currM = macd[i];
    const currS = signal[i];

    if (prevM == null || prevS == null || currM == null || currS == null) continue;

    // Bullish
    if (prevM < prevS && currM > currS) {
      alerts.push({
        index: i,
        type: "bullish",
        prev: [prevM, prevS],
        curr: [currM, currS],
      });
    }

    // Bearish
    if (prevM > prevS && currM < currS) {
      alerts.push({
        index: i,
        type: "bearish",
        prev: [prevM, prevS],
        curr: [currM, currS],
      });
    }
  }

  return alerts;
}











/*---------------------------------------------------------
   MACD CROSSOVER WITH TIMESTAMPS (TRADINGVIEW ACCURATE)
---------------------------------------------------------*/
function getEMAWithTime(prices: { close: number; timestamp: number }[], period: number) {
  const k = 2 / (period + 1);
  const emaArray = [];
  let prevEMA = prices[0].close;

  for (let i = 0; i < prices.length; i++) {
      const price = prices[i].close;
      const timestamp = prices[i].timestamp;

      const ema = i === 0 ? price : (price - prevEMA) * k + prevEMA;
      prevEMA = ema;

      emaArray.push({ value: ema, timestamp });
  }

  return emaArray;
}

function getMACDWithTime(prices: { close: number; timestamp: number }[]) {
  const ema12 = getEMAWithTime(prices, 12);
  const ema26 = getEMAWithTime(prices, 26);

  const macd = ema12.map((e, i) => {
      return {
          value: e.value - ema26[i].value,
          timestamp: e.timestamp
      };
  });

  // Signal line (9-period EMA on MACD)
  const signal = getEMAWithTime(
      macd.map(x => ({ close: x.value, timestamp: x.timestamp })),
      9
  ).map(e => ({ value: e.value, timestamp: e.timestamp }));

  // MACD Histogram
  const histogram = macd.map((m, i) => ({
      value: m.value - signal[i].value,
      timestamp: m.timestamp
  }));

  return { macd, signal, histogram };
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", { hour12: false });
}

export function detectMACDCrossovers2(klines: any[]) {
  // Convert raw candlesticks to simplified array with close + timestamp
  const prices = klines.map(c => ({
      close: c.close,
      timestamp: c.timestamp
  }));

  const { macd, signal } = getMACDWithTime(prices);

  for (let i = 1; i < macd.length; i++) {
      const prevMACD = macd[i - 1].value;
      const prevSignal = signal[i - 1].value;

      const currMACD = macd[i].value;
      const currSignal = signal[i].value;
      const ts = macd[i].timestamp;

      // Bullish crossover
      if (prevMACD <= prevSignal && currMACD > currSignal) {
          console.log(`📈 BULLISH CROSSOVER at ${formatTimestamp(ts)}`);
      }

      // Bearish crossover
      if (prevMACD >= prevSignal && currMACD < currSignal) {
          console.log(`📉 BEARISH CROSSOVER at ${formatTimestamp(ts)}`);
      }
  }
}























// import { preProcessFile } from "typescript";
// import type { Candlestick } from "./lighter-sdk-ts/generated";
// import { indexOfLine } from "bun";

// export function getEMA(price:number[],period:number):number[] {

//     // 1st EMA
//     const smaInterval=price.length-period;
//     if(smaInterval<1){
//         throw new Error("Not enough error provided");
//         return [];
//     }
//     const multiplier=2/(period+1);
//     let sma=0;
//     for(let i=0;i<smaInterval;i++){
//         sma+=(price[i] ?? 0);
//     }
//     sma/=smaInterval;
    
//     const emas=[Number(sma.toFixed(3))];
//     // console.log("First EMA ",emas);
    
//     for(let i=period;i<price.length;i++){
//         const ema=Number(((emas[emas.length-1] ?? 0) *(1-multiplier) + (price[smaInterval + i ] ?? 0)*multiplier).toFixed(3));
//         emas.push(ema);
//     }
//     return emas;
// }


// export function getMidPrices(candlesticks: Candlestick[]): number[] {
//     return candlesticks
//         .map(({ open, close }) => Number(((open + close) / 2).toFixed(3)));
// }
  
// export function getMACD(candles: number[]) {
//     const ema26 = getEMA(candles, 26);
//     const ema12 = getEMA(candles, 12);
    
//     const macd =ema26.slice(-14).map((_,index)=>(ema26[index]??0) - (ema12[index]??0));
//     return macd;
//   }


