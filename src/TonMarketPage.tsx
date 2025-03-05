import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { fetchTonEcosystemCoins } from './services/marketService';
import { exchangeTONForToken } from './services/exchangeService';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  total_volume: number;
  rank: number;
}

const TonMarketPage: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [amountTON, setAmountTON] = useState<number>(0);
  const [userAddress, setUserAddress] = useState<string>('');

  const loadMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchTonEcosystemCoins();
      setCoins(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, []);

  const handleExchange = async () => {
    try {
      const result = await exchangeTONForToken(amountTON, userAddress);
      console.log('Exchange result:', result);
    } catch (error) {
      console.error('Exchange error:', error);
    }
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1_000_000_000) {
      return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
    } else if (marketCap >= 1_000_000) {
      return `$${(marketCap / 1_000_000).toFixed(2)}M`;
    } else if (marketCap >= 1_000) {
      return `$${(marketCap / 1_000).toFixed(2)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 10) {
      return `$${price.toFixed(3)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading market data...'}
        </div>
        <button 
          onClick={loadMarketData}
          disabled={isLoading}
          className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
            isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        {isLoading && coins.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-400">Loading market data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Coin</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">24h</th>
                  <th className="px-4 py-3">Market Cap</th>
                  <th className="px-4 py-3">Volume (24h)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin) => (
                  <tr key={coin.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-4 text-gray-400">{coin.rank}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                        <div>
                          <div className="font-medium">{coin.name}</div>
                          <div className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium">{formatPrice(coin.current_price)}</td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center ${
                        coin.price_change_percentage_24h >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {coin.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4">{formatMarketCap(coin.market_cap)}</td>
                    <td className="px-4 py-4">{formatMarketCap(coin.total_volume)}</td>
                    <td className="px-4 py-4">
                      <a 
                        href={`https://www.coingecko.com/en/coins/${coin.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <span className="text-sm">Details</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden mt-4 p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Exchange TON for Token</h2>
        <div className="flex flex-col space-y-4">
          <input
            type="number"
            value={amountTON}
            onChange={(e) => setAmountTON(Number(e.target.value))}
            placeholder="Amount of TON"
            className="px-4 py-2 rounded-lg bg-gray-700 text-white"
          />
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="User Address"
            className="px-4 py-2 rounded-lg bg-gray-700 text-white"
          />
          <button
            onClick={handleExchange}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Exchange
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center mt-4">
        Data provided by CoinGecko API
      </div>
    </div>
  );
};

export default TonMarketPage;