

import { AccountApi, ApiKeyAuthentication, IsomorphicFetchHttpLibrary, OrderApi, ServerConfiguration } from "./lighter-sdk-ts/generated";

const BASE_URL = "https://testnet.zklighter.elliot.ai"
const API_KEY_PRIVATE_KEY = process.env['API_KEY_PRIVATE_KEY']
 
// const API_KEY_INDEX = 2


export async function getOpenPositions(ACCOUNT_INDEX:number) {
    if(!API_KEY_PRIVATE_KEY)return;
    const accountApi = new AccountApi({
        baseServer: new ServerConfiguration<{  }>(BASE_URL, {  }),  
        httpApi: new IsomorphicFetchHttpLibrary(),
        middleware: [],
        authMethods: {
            apiKey: new ApiKeyAuthentication(API_KEY_PRIVATE_KEY)
        }
    });

    const currentOpenOrders = await accountApi.accountWithHttpInfo(
        'index',
        ACCOUNT_INDEX.toString()
    );

    // console.log(currentOpenOrders.data.accounts[0]?.positions);
    const allPositions = currentOpenOrders.data.accounts[0]?.positions || [];
    
    // Filter out positions where position value is zero (no actual trade)
    const activePositions = allPositions
        .filter((accountPosition) => {
            const pos = accountPosition.position;
            // Check if position is not zero - convert to number and check
            const posNum = typeof pos === 'string' ? parseFloat(pos) : Number(pos);
            return !isNaN(posNum) && posNum > 0;
        })
        .map((accountPosition) => ({
            symbol: accountPosition.symbol,
            position: accountPosition.position,
            sign: accountPosition.sign == 1 ? "LONG" : "SHORT",
            unrealizedPnl: accountPosition.unrealizedPnl,
            realizedPnl: accountPosition.realizedPnl,
            liquidationPrice: accountPosition.liquidationPrice
        }));
    
    return activePositions;
}

