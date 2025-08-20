import axios from 'axios';

// Random headers to avoid rate limiting
function getRandomHeader() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];
  
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  };
}

interface BlocksResponse {
  limit: number;
  offset: number;
  total: number;
  results: Array<{
    canonical: boolean;
    height: number;
    hash: string;
    parent_hash: string;
    burn_block_time: number;
    burn_block_time_iso: string;
    burn_block_hash: string;
    burn_block_height: number;
    miner_txid: string;
    tx_count: number;
    execution_cost_read_count: number;
    execution_cost_read_length: number;
    execution_cost_runtime: number;
    execution_cost_write_count: number;
    execution_cost_write_length: number;
  }>;
}

/**
 * Fetches the current block height from Hiro API
 * @param network - 'mainnet', 'testnet', or 'mocknet'
 * @returns Promise<number> - Current block height
 */
export async function fetchBlockHeight(network: 'mainnet' | 'testnet' | 'mocknet' = 'testnet'): Promise<number> {
  const baseUrl = network === 'mainnet' 
    ? 'https://api.hiro.so/extended/v2/blocks?limit=1&offset=0'
    : 'https://api.testnet.hiro.so/extended/v2/blocks?limit=1&offset=0';

  try {
    const response = await axios.get<BlocksResponse>(baseUrl, { 
      headers: getRandomHeader(),
      timeout: 10000 // 10 second timeout
    });
    
    const data = response.data;
    if (data && data.total) {
      const blockHeight = Number(data.total);
      console.log(`Current ${network} block height: ${blockHeight}`);
      return blockHeight;
    } else {
      throw new Error('Invalid response format from Hiro API');
    }
  } catch (error) {
    console.error(`Error fetching ${network} block height:`, error);
    
    // Fallback: return a reasonable default based on network
    const fallbackHeight = network === 'mainnet' ? 150000 : 50000;
    console.warn(`Using fallback block height: ${fallbackHeight}`);
    return fallbackHeight;
  }
}

/**
 * Gets a recent block height (current - offset) for chainhook start_block
 * @param network - 'mainnet', 'testnet', or 'mocknet'
 * @param blocksBack - How many blocks back from current (default: 10)
 * @returns Promise<number> - Block height to start monitoring from
 */
export async function getStartBlockHeight(network: 'mainnet' | 'testnet' | 'mocknet' = 'testnet', blocksBack: number = 10): Promise<number> {
  try {
    const currentHeight = await fetchBlockHeight(network);
    const startHeight = Math.max(0, currentHeight - blocksBack);
    console.log(`Start block height for chainhook: ${startHeight} (${blocksBack} blocks back from ${currentHeight})`);
    return startHeight;
  } catch (error) {
    console.error('Error getting start block height:', error);
    // Fallback to recent block height
    const fallbackStart = network === 'mainnet' ? 149990 : 49990;
    return fallbackStart;
  }
}