

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

    console.log(currentOpenOrders.data.accounts[0]?.positions);
    return currentOpenOrders.data.accounts[0]?.positions.map((accountPosition) => ({
        symbol: accountPosition.symbol,
        position: accountPosition.position,
        sign: accountPosition.sign == 1 ? "LONG" : "SHORT",
        unrealizedPnl: accountPosition.unrealizedPnl,
        realizedPnl: accountPosition.realizedPnl,
        liquidationPrice: accountPosition.liquidationPrice
    }));
}

