import { getOpenPositions } from './openPositions';
import { GoogleGenAI } from "@google/genai";
import { getIndicators } from './stockdata';
import { MARKETS } from './markets';
import { executeTrade } from './trading';
import type { TradeSignal } from './trading';
import { PROMPT } from './prompt';



// Configuration
const GOOGLE_API_KEY = process.env['GOOGLE_API_KEY'] || 'YOUR_GOOGLE_API_KEY_HERE';
const ACCOUNT_INDEX = parseInt(process.env['ACCOUNT_INDEX'] || '0');
const BASE_AMOUNT = parseInt(process.env['BASE_AMOUNT'] || '1000'); // Default 1 SOL
let INVOCATION_COUNT = 0; // Track invocation count

// Initialize AI client
const ai = new GoogleGenAI({
  apiKey: GOOGLE_API_KEY
});

async function invokeAgent() {
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is required');
    return;
  }

  INVOCATION_COUNT++;
  console.log(`📊 Gathering market indicators (Invocation only once #${INVOCATION_COUNT})...`);
  
  // Collect indicators for all markets
  let ALL_INDICATOR_DATA = "";
  
  const indicators = await Promise.all(
    Object.keys(MARKETS).map(async (marketSlug) => {
      const market = MARKETS[marketSlug];
      if (!market) return null;
      // midPrices,macd,ema20s,
      const intradayIndicators = await getIndicators("5m", market.marketId);
      const longTermIndicators = await getIndicators("4h", market.marketId);
      
      const marketData = `
    MARKET - ${marketSlug}
    Intraday (5m candles) (oldest → latest):
    Mid prices - [${intradayIndicators.midPrices.join(",")}]
    EMA20 - [${intradayIndicators.ema20s.join(",")}]
    MACD - [${intradayIndicators.macd.join(",")}]

    Long Term (4h candles) (oldest → latest):
    Mid prices - [${longTermIndicators.midPrices.join(",")}]
    EMA20 - [${longTermIndicators.ema20s.join(",")}]
    MACD - [${longTermIndicators.macd.join(",")}]

    `;
      
      ALL_INDICATOR_DATA += marketData;
      return { marketSlug, intradayIndicators, longTermIndicators };
    })
  );
  
  // Filter out null results
  const validIndicators = indicators.filter((ind): ind is NonNullable<typeof ind> => ind !== null);

  console.log('✅ Indicators collected');
  console.log('📈 Fetching open positions...');
  
  // Get open positions
  const openPositions = await getOpenPositions(ACCOUNT_INDEX);
  const positionsText = openPositions 
    ? openPositions.map((position) => `${position.symbol} ${position.position} ${position.sign}`).join(", ")
    : "No open positions";
  
  const positionsJson = openPositions ? JSON.stringify(openPositions, null, 2) : "[]";

  // Portfolio values (placeholder - update if you have portfolio data)
  const portfolioValue = "$0";
  const availableCash = "$0";
  const accountValue = "$0";

  // Build enriched prompt using the same structure as the reference code
  const enrichedPrompt = PROMPT
    .replace("{{INVOKATION_TIMES}}", INVOCATION_COUNT.toString())
    .replace("{{OPEN_POSITIONS}}", positionsText)
    .replace("{{PORTFOLIO_VALUE}}", portfolioValue)
    .replace("{{ALL_INDICATOR_DATA}}", ALL_INDICATOR_DATA)
    .replace("{{AVAILABLE_CASH}}", availableCash)
    .replace("{{CURRENT_ACCOUNT_VALUE}}", accountValue)
    .replace("{{CURRENT_ACCOUNT_POSITIONS}}", positionsJson);

  console.log('🤖 Requesting AI trading decision...');
  console.log('\n--- Enriched Prompt ---');
  // console.log(enrichedPrompt);
  console.log('--- End Prompt ---\n');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: enrichedPrompt,
    });
    
    const responseText = response.text || '';
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 AI TRADING DECISION');
    console.log('='.repeat(80) + '\n');
    console.log(responseText);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Parse trading signals from response
    const signals = parseTradingSignals(responseText, validIndicators);
    console.log(signals);
    
    // Execute trades
    if (signals.length > 0) {
      console.log('📈 Executing trades based on AI signals...\n');
      for (const signal of signals) {
        if (signal.action === 'HOLD') {
          console.log(`⏸️  HOLD signal for ${signal.market} - no trade executed`);
          continue;
        }
        
        const market = MARKETS[signal.market];
        if (!market) {
          console.error(`❌ Unknown market: ${signal.market}`);
          continue;
        }
        
        // Get current price from latest indicator data
        const marketData = validIndicators.find(ind => ind.marketSlug === signal.market);
        if (!marketData) {
          console.error(`❌ No data found for market: ${signal.market}`);
          continue;
        }
        
        // Use the latest mid price as current price
        const prices = marketData.intradayIndicators.midPrices;
        const currentPrice = prices[prices.length - 1];
        
        if (currentPrice === undefined) {
          console.error(`❌ No price data available for ${signal.market}`);
          continue;
        }
        // console.log();
        
        
        try {
          await executeTrade(ACCOUNT_INDEX, market.marketId, signal.action, currentPrice, BASE_AMOUNT);
          console.log(" Buyed a Stock");
          
        } catch (error) {
          console.error(`❌ Failed to execute trade for ${signal.market}:`, error);
        }
      }
    } else {
      console.log('⚠️  No trading signals detected in AI response');
    }
    
    return responseText;
  } catch (error) {
    console.error('❌ Error generating trading decision:', error);
    throw error;
  }
}

function parseTradingSignals(responseText: string, indicators: Array<{marketSlug: string}>): TradeSignal[] {
  const signals: TradeSignal[] = [];
  
  // Parse MARKET:, ACTION:, and QUANTITY: lines
  const lines = responseText.split('\n');
  let currentMarket: string | null = null;
  let currentAction: 'LONG' | 'SHORT' | 'HOLD' | 'CLOSE' | null = null;
  let currentQuantity: number | undefined = undefined;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    
    // Match MARKET: pattern
    const marketMatch = line.match(/MARKET:\s*(\w+)/i);
    if (marketMatch && marketMatch[1]) {
      // If we have a pending signal, save it before starting a new one
      if (currentMarket && currentAction) {
        const marketExists = indicators.some(ind => ind.marketSlug === currentMarket);
        if (marketExists) {
          signals.push({
            action: currentAction,
            market: currentMarket,
            quantity: currentQuantity
          });
        }
      }
      currentMarket = marketMatch[1].toUpperCase();
      currentAction = null;
      currentQuantity = undefined;
      continue;
    }
     
    const actionMatch = line.match(/ACTION:\s*(LONG|SHORT|HOLD|CLOSE)/i);
    if (actionMatch && actionMatch[1] && currentMarket) {
      const action = actionMatch[1].toUpperCase(); 
      currentAction =action as  'CLOSE' | 'LONG' | 'SHORT' | 'HOLD';
      continue;
    }
    
    // Match QUANTITY: pattern
    const quantityMatch = line.match(/QUANTITY:\s*([\d.]+)/i);
    if (quantityMatch && quantityMatch[1] && currentMarket) {
      currentQuantity = parseFloat(quantityMatch[1]);
      continue;
    }
    
    // If we hit REASON: or end of market block, save the signal
    if (line.match(/REASON:/i) && currentMarket && currentAction) {
      const marketExists = indicators.some(ind => ind.marketSlug === currentMarket);
      if (marketExists) {
        signals.push({
          action: currentAction,
          market: currentMarket,
          quantity: currentQuantity
        });
      }
      // Reset for next market
      currentMarket = null;
      currentAction = null;
      currentQuantity = undefined;
    }
  }
  
  // Save any remaining signal
  if (currentMarket && currentAction) {
    const marketExists = indicators.some(ind => ind.marketSlug === currentMarket);
    if (marketExists) {
      signals.push({
        action: currentAction,
        market: currentMarket,
        quantity: currentQuantity
      });
    }
  }
  
  return signals;
}

async function main() {
  try {
    await invokeAgent();// called only once.
  } catch (error) {
    console.error('Failed to run agent:', error);
    process.exit(1);
  }
}

// Run the agent
await main();