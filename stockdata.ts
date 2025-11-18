import { CandlestickApi, IsomorphicFetchHttpLibrary, ServerConfiguration } from "./lighter-sdk-ts/generated";
import { getEMA, getMACD, getMidPrices ,getMACDFull ,detectMACDCrossovers , detectMACDCrossovers2} from "./indicator";
const BASE_URL = "https://mainnet.zklighter.elliot.ai"
const SOL_MARKET_ID = 2

const klinesApi = new CandlestickApi({
    baseServer: new ServerConfiguration<{}>(BASE_URL, {}),
    httpApi: new IsomorphicFetchHttpLibrary(),
    middleware: [],
    authMethods: {}
});

export async function getIndicators(duration:"5m" | "4h",marketId:number): Promise<{midPrices:number[],macd:number[],ema20s:number[]}> {
    const klines = await klinesApi.candlesticks(marketId, duration, Date.now() - 1000 * 60 * 60 * (duration=='5m'? 2 : 96 ), Date.now(), 50, false);
    const midprices = await getMidPrices(klines.candlesticks);
    const ema20 = await getEMA(midprices, 20);
    const macdData = getMACDFull(midprices);
    // Extract MACD line values, filter nulls and get last 10
    const macd = macdData.macd.filter((v): v is number => v !== null).slice(-10);
    // Filter nulls from EMA20 and get last 10
    const ema20Filtered = ema20.filter((v): v is number => v !== null).slice(-10);
    return {
        midPrices: midprices.slice(-10),
        macd: macd,
        ema20s: ema20Filtered
    }    
}

// Removed test code - function is now exported for use in index.ts


