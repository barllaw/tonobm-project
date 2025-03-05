import { Coin } from '../types';

// Fetch TON ecosystem coins from CoinGecko API
export const fetchTonEcosystemCoins = async (): Promise<Coin[]> => {
  try {
    console.log('Fetching TON ecosystem coins from CoinGecko API');
    
    // Using CoinGecko API to get top coins by market cap
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=ton-ecosystem&order=market_cap_desc&per_page=50&page=1&sparkline=false&locale=en'
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} TON ecosystem coins`);
    
    // Transform the data to match our Coin interface
    return data.map((coin: any, index: number) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      total_volume: coin.total_volume,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error fetching TON ecosystem coins:', error);
    
    // Return mock data if API fails
    return getMockTonEcosystemCoins();
  }
};

// Mock data in case the API fails
const getMockTonEcosystemCoins = (): Coin[] => {
  return [
    {
      id: 'the-open-network',
      name: 'Toncoin',
      symbol: 'ton',
      image: 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
      current_price: 6.12,
      market_cap: 21053000000,
      price_change_percentage_24h: 2.5,
      total_volume: 58000000,
      rank: 1
    },
    {
      id: 'tegro',
      name: 'Tegro',
      symbol: 'tgr',
      image: 'https://assets.coingecko.com/coins/images/26631/large/tgr.png',
      current_price: 0.0142,
      market_cap: 14200000,
      price_change_percentage_24h: -1.2,
      total_volume: 1200000,
      rank: 2
    },
    {
      id: 'ton-doge',
      name: 'TON DOGE',
      symbol: 'tondoge',
      image: 'https://assets.coingecko.com/coins/images/29069/large/ton_doge.png',
      current_price: 0.00000352,
      market_cap: 8520000,
      price_change_percentage_24h: 5.8,
      total_volume: 520000,
      rank: 3
    },
    {
      id: 'notcoin',
      name: 'Notcoin',
      symbol: 'not',
      image: 'https://assets.coingecko.com/coins/images/31457/large/not.png',
      current_price: 0.0112,
      market_cap: 7800000,
      price_change_percentage_24h: -3.4,
      total_volume: 420000,
      rank: 4
    },
    {
      id: 'tonup',
      name: 'Tonup',
      symbol: 'tonup',
      image: 'https://assets.coingecko.com/coins/images/31458/large/tonup.png',
      current_price: 0.00000124,
      market_cap: 6240000,
      price_change_percentage_24h: 1.7,
      total_volume: 180000,
      rank: 5
    },
    {
      id: 'ton-token',
      name: 'TON Token',
      symbol: 'ton',
      image: 'https://assets.coingecko.com/coins/images/31459/large/ton_token.png',
      current_price: 0.0023,
      market_cap: 5800000,
      price_change_percentage_24h: 0.8,
      total_volume: 120000,
      rank: 6
    }
  ];
};