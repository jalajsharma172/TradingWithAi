import { AccountApi, ApiKeyAuthentication, IsomorphicFetchHttpLibrary, OrderApi, ServerConfiguration } from "./lighter-sdk-ts/generated";
import { NonceManagerType } from "./lighter-sdk-ts/nonce_manager";
import { SignerClient } from "./lighter-sdk-ts/signer";
import { CandlestickApi } from "./lighter-sdk-ts/generated";
import { getOpenPositions } from "./openPositions";
import { MARKETS } from "./markets";
import { getLatestPrice } from "./stockdata";
import { basename } from "path";
import axios from "axios";
const BASE_URL = "https://testnet.zklighter.elliot.ai"
const API_KEY_PRIVATE_KEY = process.env['API_KEY_PRIVATE_KEY']
const ACCOUNT_INDEX = 3
const SOL_MARKET_ID = 2
const API_KEY_INDEX = 2



export async function cancelOrder() {
     console.log("Cancelling Order");
    const client = await SignerClient.create({
        url: BASE_URL,
        privateKey: API_KEY_PRIVATE_KEY,
        apiKeyIndex: API_KEY_INDEX,
        accountIndex: ACCOUNT_INDEX,
        nonceManagementType: NonceManagerType.OPTIMISTIC
    });
    //  console.log("Client is sucessfully created",client);
    
    const candleStickApi = new CandlestickApi({
        baseServer: new ServerConfiguration<{  }>(BASE_URL, {  }),
        httpApi: new IsomorphicFetchHttpLibrary(),
        middleware: [],
        authMethods: {}
    }); 
    const openPositions = await getOpenPositions(ACCOUNT_INDEX);
    console.log(openPositions);
        openPositions?.forEach(async ({position, sign, symbol}) => {
            
            
            if(Number(position)!=0){   //valid Open postion
                console.log(sign+" "+position+" "+symbol+" -> Change it to opposite");
                const candleStickData = await candleStickApi.candlesticks(SOL_MARKET_ID, '1m', Date.now() - 1000 * 60 * 5, Date.now(), 1, false);
                 const latestPrice = candleStickData.candlesticks[candleStickData.candlesticks.length - 1]?.close;
                  if (!latestPrice) {
                    throw new Error("No latest price found");
                } 
                sign = sign == "LONG" ? "SHORT" : "LONG";
                console.log(sign+" "+position+" "+symbol);
                 // create opposite order to close the position
                // Long--> Short                +        Short => Long

                try {
             
                    
                } catch (err) {
                    console.log("Process error ",err);
                    
                }       
            }
        

    });
}

 