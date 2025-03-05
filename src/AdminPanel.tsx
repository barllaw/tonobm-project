import React, { useState, useEffect } from 'react';
import { X, Users, BarChart, Settings, LogOut, DollarSign, Wallet, TrendingUp, RefreshCw, UserPlus } from 'lucide-react';
import { getAllWallets, getWalletCount } from './services/walletService';
import { 
  getExchangeRate, 
  updateExchangeRate, 
  getVoucherRates, 
  updateVoucherRate,
  getTransactionCount,
  getTotalVolume,
  getRecentTransactions
} from './services/exchangeService';
import { WalletData } from './types';
import TonMarketPage from './TonMarketPage';
import UsersPage from './UsersPage';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectedWallets, setConnectedWallets] = useState<WalletData[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(3.5);
  const [newExchangeRate, setNewExchangeRate] = useState('3.5');
  const [standardBonus, setStandardBonus] = useState(4);
  const [premiumBonus, setPremiumBonus] = useState(7.5);
  const [standardVoucherId, setStandardVoucherId] = useState('');
  const [premiumVoucherId, setPremiumVoucherId] = useState('');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [isUpdatingStandardBonus, setIsUpdatingStandardBonus] = useState(false);
  const [isUpdatingPremiumBonus, setIsUpdatingPremiumBonus] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  
  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get wallets
        const wallets = await getAllWallets();
        setConnectedWallets(wallets);
        
        // Get transaction stats
        const transactions = await getTransactionCount();
        setTotalTransactions(transactions);
        
        // Get volume
        const volume = await getTotalVolume();
        setTotalVolume(volume);
        
        // Get exchange rate
        await loadExchangeRates();
        
        // Get recent activity
        const recent = await getRecentTransactions(3);
        setRecentActivity(recent);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load exchange rates from database
  const loadExchangeRates = async () => {
    try {
      console.log('Loading exchange rates from database');
      // Get exchange rate
      const rate = await getExchangeRate();
      console.log('Loaded exchange rate:', rate);
      setExchangeRate(rate);
      setNewExchangeRate(rate.toString());
      
      // Get voucher rates
      const voucherRates = await getVoucherRates();
      voucherRates.forEach(voucher => {
        if (voucher.name.includes('Standard')) {
          setStandardBonus(voucher.bonus);
          setStandardVoucherId(voucher.id);
        } else if (voucher.name.includes('Premium')) {
          setPremiumBonus(voucher.bonus);
          setPremiumVoucherId(voucher.id);
        }
      });
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    }
  };

  // Refresh rates from database
  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      await loadExchangeRates();
    } catch (error) {
      console.error('Error refreshing rates:', error);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  // Handle exchange rate update
  const handleUpdateExchangeRate = async () => {
    const rate = parseFloat(newExchangeRate);
    if (isNaN(rate) || rate <= 0) {
      alert('Please enter a valid exchange rate');
      return;
    }
    
    setIsUpdatingRate(true);
    try {
      await updateExchangeRate('TON_USDT', rate);
      setExchangeRate(rate);
      alert('Exchange rate updated successfully');
      
      // Refresh rates to ensure UI is in sync with database
      await loadExchangeRates();
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      alert('Failed to update exchange rate');
    } finally {
      setIsUpdatingRate(false);
    }
  };

  // Handle standard voucher bonus update
  const handleUpdateStandardBonus = async () => {
    if (!standardVoucherId) {
      alert('Standard voucher ID not found');
      return;
    }
    
    setIsUpdatingStandardBonus(true);
    try {
      await updateVoucherRate(standardVoucherId, standardBonus);
      alert('Standard voucher bonus updated successfully');
    } catch (error) {
      console.error('Error updating standard voucher bonus:', error);
      alert('Failed to update standard voucher bonus');
    } finally {
      setIsUpdatingStandardBonus(false);
    }
  };

  // Handle premium voucher bonus update
  const handleUpdatePremiumBonus = async () => {
    if (!premiumVoucherId) {
      alert('Premium voucher ID not found');
      return;
    }
    
    setIsUpdatingPremiumBonus(true);
    try {
      await updateVoucherRate(premiumVoucherId, premiumBonus);
      alert('Premium voucher bonus updated successfully');
    } catch (error) {
      console.error('Error updating premium voucher bonus:', error);
      alert('Failed to update premium voucher bonus');
    } finally {
      setIsUpdatingPremiumBonus(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  // Format wallet address for display
  const formatWalletAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Navigate to user registration page
  const navigateToUserRegistration = () => {
    window.location.href = '/register-user';
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 p-4 flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <Wallet className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>
          
          <nav className="flex-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left mb-2 p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'dashboard' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'
              }`}
            >
              <BarChart className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('wallets')}
              className={`w-full text-left mb-2 p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'wallets' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Connected Wallets</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full text-left mb-2 p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'users' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'
              }`}
            >
              <UserPlus className="h-5 w-5" />
              <span>User Management</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left mb-2 p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'settings' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('market')}
              className={`w-full text-left mb-2 p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'market' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>TON Market</span>
            </button>
          </nav>
          
          <button 
            onClick={onClose}
            className="w-full p-3 mt-auto rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 flex items-center justify-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Exit Admin</span>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'wallets' && 'Connected Wallets'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'settings' && 'Settings'}
              {activeTab === 'market' && 'TON Ecosystem Market'}
            </h1>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {isLoading && activeTab !== 'market' && activeTab !== 'users' ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-400">Loading data...</span>
            </div>
          ) : (
            <>
              {/* Dashboard Content */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="text-gray-400 mb-1">Connected Wallets</div>
                      <div className="text-3xl font-bold">{connectedWallets.length}</div>
                      <div className="mt-2 text-green-400 text-sm">
                        {connectedWallets.length > 0 ? '+1 since yesterday' : 'No wallets yet'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="text-gray-400 mb-1">Total Transactions</div>
                      <div className="text-3xl font-bold">{totalTransactions}</div>
                      <div className="mt-2 text-green-400 text-sm">
                        {totalTransactions > 0 ? '+2 today' : 'No transactions yet'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="text-gray-400 mb-1">Total Volume</div>
                      <div className="text-3xl font-bold">{totalVolume.toFixed(2)} TON</div>
                      <div className="mt-2 text-green-400 text-sm">
                        {totalVolume > 0 ? '+0.5 TON today' : 'No volume yet'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="bg-gray-800 rounded-xl p-4">
                    <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                    {recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                            <div>
                              <div className="font-medium">Wallet {formatWalletAddress(activity.walletAddress)}</div>
                              <div className="text-sm text-gray-400">
                                {activity.type === 'swap' 
                                  ? 'Swapped TON to USDT' 
                                  : `Purchased ${activity.details?.voucherName || 'Voucher'}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-400">{activity.amount.toFixed(1)} TON</div>
                              <div className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No recent activity to display
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Wallets Content */}
              {activeTab === 'wallets' && (
                <div>
                  <div className="bg-gray-800 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Connected Wallets</h3>
                      <div className="text-sm text-gray-400">Total: {connectedWallets.length}</div>
                    </div>
                    
                    {connectedWallets.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-gray-400 border-b border-gray-700">
                              <th className="pb-2">Wallet Address</th>
                              <th className="pb-2">Last Active</th>
                              <th className="pb-2">Total Swapped</th>
                              <th className="pb-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {connectedWallets.map((wallet, index) => (
                              <tr key={index} className="border-b border-gray-700/50">
                                <td className="py-3">{formatWalletAddress(wallet.address)}</td>
                                <td className="py-3">{new Date(wallet.lastActive).toLocaleDateString()}</td>
                                <td className="py-3">{wallet.totalSwapped.toFixed(2)} TON</td>
                                <td className="py-3">
                                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No wallets connected yet
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Users Management Content */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={navigateToUserRegistration}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Register New User</span>
                    </button>
                  </div>
                  <UsersPage />
                </div>
              )}
              
              {/* Settings Content */}
              {activeTab === 'settings' && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Exchange Settings</h3>
                    <button 
                      onClick={handleRefreshRates}
                      disabled={isRefreshingRates}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                        isRefreshingRates ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingRates ? 'Refreshing...' : 'Refresh Rates'}</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-1">Receiver Wallet Address</label>
                      <input 
                        type="text" 
                        value="UQDa2QRkf7Jj3dYqwRdU7XO6s21WvlvkG-NjUs77htjOMcEI"
                        readOnly
                        className="w-full bg-gray-700 rounded-lg p-2 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 mb-1">Exchange Rate (TON to USDT)</label>
                      <div className="flex items-center">
                        <input 
                          type="number" 
                          value={newExchangeRate}
                          onChange={(e) => setNewExchangeRate(e.target.value)}
                          className="w-full bg-gray-700 rounded-lg p-2 text-sm"
                          step="0.01"
                          min="0.01"
                        />
                        <button 
                          className={`ml-2 px-3 py-2 rounded-lg text-sm ${
                            isUpdatingRate 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={handleUpdateExchangeRate}
                          disabled={isUpdatingRate}
                        >
                          {isUpdatingRate ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Current rate from database: {exchangeRate} USDT per TON
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 mb-1">Standard Voucher Bonus (%)</label>
                      <div className="flex items-center">
                        <input 
                          type="number" 
                          value={standardBonus}
                          onChange={(e) => setStandardBonus(parseFloat(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg p-2 text-sm"
                          step="0.1"
                          min="0"
                        />
                        <button 
                          className={`ml-2 px-3 py-2 rounded-lg text-sm ${
                            isUpdatingStandardBonus 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={handleUpdateStandardBonus}
                          disabled={isUpdatingStandardBonus}
                        >
                          {isUpdatingStandardBonus ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Current bonus from database: {standardBonus}%
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 mb-1">Premium Voucher Bonus (%)</label>
                      <div className="flex items-center">
                        <input 
                          type="number" 
                          value={premiumBonus}
                          onChange={(e) => setPremiumBonus(parseFloat(e.target.value))}
                          className="w-full bg-gray-700 rounded-lg p-2 text-sm"
                          step="0.1"
                          min="0"
                        />
                        <button 
                          className={`ml-2 px-3 py-2 rounded-lg text-sm ${
                            isUpdatingPremiumBonus 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={handleUpdatePremiumBonus}
                          disabled={isUpdatingPremiumBonus}
                        >
                          {isUpdatingPremiumBonus ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Current bonus from database: {premiumBonus}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* TON Market Content */}
              {activeTab === 'market' && <TonMarketPage />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;