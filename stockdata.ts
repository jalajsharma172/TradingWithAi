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

async function getIndicators(duration:"5m" | "4h",marketId:number): Promise<{midprices:number[],macd:number[],ema20s:number[]}> {
    const klines = await klinesApi.candlesticks(marketId, duration, Date.now() - 1000 * 60 * 60 * (duration=='5m'? 2 : 96 ), Date.now(), 50, false);
    const midprices =await getMidPrices(klines.candlesticks);
    const ema20=await getEMA(midprices,20);
    const macd= await getMidPrices(klines.candlesticks);
    return {
        midprices:midprices.slice(-10),
        macd:macd.slice(-10),
        ema20s:ema20.slice(-10)
    }    
}

async function getKlines(marketId: number) {
    getIndicators("4h",marketId);
    getIndicators("5m",marketId);
}

getKlines(SOL_MARKET_ID);


