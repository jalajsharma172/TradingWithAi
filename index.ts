import { CandlestickApi, IsomorphicFetchHttpLibrary, ServerConfiguration } from "./lighter-sdk-ts/generated";
import { getEMA, getMACD, getMidPrices ,getMACDFull ,detectMACDCrossovers , detectMACDCrossovers2} from "./indicator";
const BASE_URL = "https://mainnet.zklighter.elliot.ai"
const SOL_MARKET_ID = 2

async function getKlines(marketId: number) {
    const klinesApi = new CandlestickApi({
        baseServer: new ServerConfiguration<{}>(BASE_URL, {}),
        httpApi: new IsomorphicFetchHttpLibrary(),
        middleware: [],
        authMethods: {}
    });

    const klines = await klinesApi.candlesticks(SOL_MARKET_ID, '5m', Date.now() - 1000 * 60 * 60 * 3, Date.now(), 50, false);
    // console.log(klines.candlesticks);
    // const midprices = getMidPrices(klines.candlesticks);
    // console.log("MidPrices ",midprices);     
    // const ema20=getEMA(midprices,20);
    // console.log(ema20.slice(-10));
    // const macd=getMACD(midprices);
    // console.log("MACd ", macd);
    // console.log("MACd ", macd.slice(-10));
    
  
    // const {     macdLine,        signalLine,        histogram,} = getMACD(midprices);
    // if (!macdLine || !signalLine) {
    //     console.error("MACD not computed!");
    //     return;
    //   }
    
    // const crossovers = detectMACDCrossovers(macdLine, signalLine);        
    // console.log("Crossovers:", crossovers);

    const crossovers = detectMACDCrossovers2(klines.candlesticks);        
    console.log("Crossovers:", crossovers);



}

getKlines(SOL_MARKET_ID);


