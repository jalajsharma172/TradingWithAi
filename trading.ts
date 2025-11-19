import { SignerClient } from "./lighter-sdk-ts/signer";
import { NonceManagerType } from "./lighter-sdk-ts/nonce_manager";

const BASE_URL = "https://mainnet.zklighter.elliot.ai";
const API_KEY_PRIVATE_KEY = process.env['API_KEY_PRIVATE_KEY'] || '';
const API_KEY_INDEX = parseInt(process.env['API_KEY_INDEX'] || '2');

export interface TradeSignal {
  action: 'LONG' | 'SHORT' | 'HOLD';
  market: string;
  quantity?: number;
  confidence?: number;
}

export async function executeTrade(
  accountIndex: number,
  marketId: number,
  signal: 'LONG' | 'SHORT',
  currentPrice: number,
  baseAmount: number = 1000 // Default 1 SOL (1000 = 1.0 SOL in base units)
): Promise<void> {
  if (!API_KEY_PRIVATE_KEY) {
    throw new Error('API_KEY_PRIVATE_KEY is required for trading');
  }

  console.log(`\n🔄 Executing ${signal} trade for market ${(marketId==2)?'SOL':'ETH'} at price ${currentPrice}...`);

  try {
    const client = await SignerClient.create({
      url: BASE_URL,
      privateKey: API_KEY_PRIVATE_KEY,
      apiKeyIndex: API_KEY_INDEX,
      accountIndex: accountIndex,
      nonceManagementType: NonceManagerType.OPTIMISTIC
    });

    // Convert price to micro USDC (price is in USDC, need to multiply by 1e6)
    const priceInMicroUSDC = Math.round(currentPrice * 1e6);

    // LONG = buy = isAsk: false, SHORT = sell = isAsk: true
    const isAsk = signal === 'SHORT';

    await client.createOrder({
      marketIndex: marketId,
      clientOrderIndex: Math.floor(Math.random() * 1000000), // Random client order index
      baseAmount: baseAmount,
      price: priceInMicroUSDC,
      isAsk: isAsk,
      orderType: SignerClient.ORDER_TYPE_MARKET, // Market order for immediate execution
      timeInForce: SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
      reduceOnly: 0,
      triggerPrice: SignerClient.NIL_TRIGGER_PRICE,
      orderExpiry: SignerClient.DEFAULT_IOC_EXPIRY,
    });

    console.log(`✅ ${signal} order placed successfully!`);
  } catch (error) {
    console.error(`❌ Failed to execute ${signal} trade:`, error);
    throw error;
  }
}

