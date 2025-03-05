import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Copy, Check, TrendingUp, Users, DollarSign, RefreshCw, Percent } from 'lucide-react';
import { getCurrentUser, getUserTransactions, logoutUser } from './services/userService';
import { User, ReferralTransaction } from './types';

const UserDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<number>(0);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [transactions, setTransactions] = useState<ReferralTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = '/user-login';
        return;
      }
      
      setUser(currentUser);
      setReferrals(currentUser.referrals);
      setTotalCommission(currentUser.totalCommission);
      setCommissionRate(currentUser.commissionRate || 5);
      
      // Get user referral transactions
      const userTransactions = await getUserTransactions(currentUser.id);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const copyReferralCode = () => {
    if (!user) return;
    
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReferralLink = () => {
    if (!user) return '';
    
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${user.referralCode}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatWalletAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full text-center">
          <p className="text-xl mb-4">You are not logged in</p>
          <a 
            href="/user-login" 
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Referral Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 mr-2">Welcome, {user.username}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 flex items-center"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 p-4">
          <div className="mb-6">
            <a 
              href="/"
              className="text-gray-400 hover:text-gray-300 text-sm flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Exchange
            </a>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'overview' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Overview</span>
            </button>
            
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'transactions' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>Transactions</span>
            </button>
            
            <button
              onClick={() => setActiveTab('referrals')}
              className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 ${
                activeTab === 'referrals' ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Referrals</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 bg-gray-800 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'transactions' && 'Transactions'}
              {activeTab === 'referrals' && 'Referrals'}
            </h2>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                isRefreshing ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-blue-400 mr-2" />
                    <div className="text-gray-400">Total Referrals</div>
                  </div>
                  <div className="text-3xl font-bold">{referrals}</div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-400 mr-2" />
                    <div className="text-gray-400">Total Commission</div>
                  </div>
                  <div className="text-3xl font-bold">{totalCommission.toFixed(2)} TON</div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Percent className="h-5 w-5 text-purple-400 mr-2" />
                    <div className="text-gray-400">Commission Rate</div>
                  </div>
                  <div className="text-3xl font-bold">{commissionRate}%</div>
                </div>
              </div>
              
              {/* Recent Transactions */}
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Recent Transactions</h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View All
                  </button>
                </div>
                
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              Wallet: {formatWalletAddress(transaction.referredWallet)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatDate(transaction.timestamp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400">+{transaction.commission.toFixed(4)} TON</div>
                            <div className="text-xs text-gray-400">
                              {transaction.amount.toFixed(2)} TON swapped
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No transactions yet
                  </div>
                )}
              </div>
              
              {/* Referral Info */}
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-lg font-medium mb-4">Your Referral Link</h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Referral Code</label>
                  <div className="flex items-center">
                    <div className="bg-gray-800 rounded-lg py-2 px-3 flex-1 font-mono">
                      {user.referralCode}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                      title="Copy referral code"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Referral Link</label>
                  <div className="flex items-center">
                    <div className="bg-gray-800 rounded-lg py-2 px-3 flex-1 font-mono text-sm truncate">
                      {getReferralLink()}
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                      title="Copy referral link"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-gray-900 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-4">All Transactions</h3>
              
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="pb-2 pl-3">Date</th>
                        <th className="pb-2">Wallet</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Commission</th>
                        <th className="pb-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-800">
                          <td className="py-3 pl-3">{formatDate(transaction.timestamp)}</td>
                          <td className="py-3">{formatWalletAddress(transaction.referredWallet)}</td>
                          <td className="py-3">{transaction.amount.toFixed(2)} TON</td>
                          <td className="py-3 text-green-400">+{transaction.commission.toFixed(4)} TON</td>
                          <td className="py-3">{transaction.commissionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No transactions yet. Share your referral link to start earning commissions.
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-lg font-medium mb-4">Promotion Tools</h3>
                
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-2">Your Referral Link</h4>
                  <div className="flex items-center mb-4">
                    <div className="bg-gray-800 rounded-lg py-2 px-3 flex-1 font-mono text-sm truncate">
                      {getReferralLink()}
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                      title="Copy referral link"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">
                    Share this link with your friends. When they use it to swap TON, you'll earn {commissionRate}% commission on each transaction.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-2">How It Works</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>Share your unique referral link with friends</li>
                    <li>When they visit the exchange using your link, your referral code is automatically applied</li>
                    <li>Every time they swap TON, you earn {commissionRate}% of the transaction amount</li>
                    <li>Commissions are credited to your account immediately</li>
                    <li>Track all your referrals and earnings in this dashboard</li>
                  </ol>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-lg font-medium mb-4">Referral Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 mb-1">Total Referrals</div>
                    <div className="text-3xl font-bold">{referrals}</div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 mb-1">Total Earnings</div>
                    <div className="text-3xl font-bold">{totalCommission.toFixed(2)} TON</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;