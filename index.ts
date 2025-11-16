import { CandlestickApi, IsomorphicFetchHttpLibrary, ServerConfiguration } from "./lighter-sdk-ts/generated";
import { getEMA, getEMA2, getMACD, getMidPrices } from "./indicator";
const BASE_URL = "https://mainnet.zklighter.elliot.ai"
const SOL_MARKET_ID = 2

async function getKlines(marketId: number) {
    const klinesApi = new CandlestickApi({
        baseServer: new ServerConfiguration<{}>(BASE_URL, {}),
        httpApi: new IsomorphicFetchHttpLibrary(),
        middleware: [],
        authMethods: {}
    });

    const klines = await klinesApi.candlesticks(SOL_MARKET_ID, '1m', Date.now() - 1000 * 60 * 60 * 3, Date.now(), 50, false);
    // console.log(klines);
    const midprices = getMidPrices(klines.candlesticks);
    console.log("MidPrices ",midprices.length); 
    const ema14 = getEMA2(midprices, 14);
    console.log(ema14);
    
    
    
    const macd=getMACD(midprices);
    console.log("MACd ", macd.slice(-10));
    
}

getKlines(SOL_MARKET_ID);


