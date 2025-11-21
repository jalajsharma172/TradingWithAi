import { NonceManagerType } from "./lighter-sdk-ts/nonce_manager";
import { SignerClient } from "./lighter-sdk-ts/signer";
import { AccountApi, ApiKeyAuthentication, IsomorphicFetchHttpLibrary, OrderApi, ServerConfiguration } from "./lighter-sdk-ts/generated";
import { createOrder } from "./createOrder";
import { cancelOrder } from "./cancelOrder";
const BASE_URL = "https://testnet.zklighter.elliot.ai"
const API_KEY_PRIVATE_KEY = process.env['API_KEY_PRIVATE_KEY']!
const ACCOUNT_INDEX = 3
const API_KEY_INDEX = 2  
const SOL_MARKET_ID = 2  


export async function executeTrade(ACCOUNT_INDEX:number,marketId:number,action:string,price:number,baseAmount:number) {

    if(action=="LONG"){
        createOrder();
    }else if(action=="SHORT"){
        createOrder();
    }else if(action=="CLOSE"){
        cancelOrder();
    }



    // const client = await SignerClient.create({
    //     url: BASE_URL,
    //     privateKey: API_KEY_PRIVATE_KEY,
    //     apiKeyIndex: API_KEY_INDEX,
    //     accountIndex: ACCOUNT_INDEX,
    //     nonceManagementType: NonceManagerType.OPTIMISTIC
    // });

    

    // creates a limit order to buy 1.0 SOL at 170000 (170 USDC)
    // await client.createOrder({
    //     marketIndex: SOL_MARKET_ID,
    //     clientOrderIndex: 0,
    //     baseAmount: 1000,
    //     price: 170000,
    //     isAsk: false,
    //     orderType: SignerClient.ORDER_TYPE_LIMIT,
    //     timeInForce: SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME,
    //     reduceOnly: 0,
    //     triggerPrice: SignerClient.NIL_TRIGGER_PRICE,
    //     orderExpiry: SignerClient.DEFAULT_28_DAY_ORDER_EXPIRY,
    // });
}

 