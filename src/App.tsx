import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { ArrowDownUp, Diamond, DollarSign, RefreshCw, Ticket, X, ChevronDown, User, AlertTriangle } from 'lucide-react';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import UserRegistrationPage from './UserRegistrationPage';
import UserLoginPage from './UserLoginPage';
import UserDashboard from './UserDashboard';
import UserCreatePage from './UserCreatePage';
import { Voucher } from './types';
import { addWallet, updateWalletActivity, updateWalletSwapAmount } from './services/walletService';
import { 
  getExchangeRate, 
  recordTransaction, 
  initializeExchangeRates,
  exchangeTONForFUS
} from './services/exchangeService';
import { fetchTonEcosystemCoins } from './services/marketService';
import { getUserByReferralCode, recordReferral } from './services/userService';

// Track connected wallets globally
const connectedWalletsSet = new Set<string>();

// Define available currencies
interface Currency {
  id: string;
  name: string;
  symbol: string;
  icon: React.ReactNode;
  rate: number;
}

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();
  const [isConnected, setIsConnected] = useState(false);
  const [sendAmount, setSendAmount] = useState<string>('0');
  const [receiveAmount, setReceiveAmount] = useState<string>('0.00');
  const [tonPrice, setTonPrice] = useState<number>(3.5); // Default TON price in USD
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showRegisterUserPage, setShowRegisterUserPage] = useState(false);
  const [showUserLoginPage, setShowUserLoginPage] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showUserCreatePage, setShowUserCreatePage] = useState(false);
  const [connectedWalletsCount, setConnectedWalletsCount] = useState(0);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showReceiveCurrencyDropdown, setShowReceiveCurrencyDropdown] = useState(false);
  const [selectedSendCurrency, setSelectedSendCurrency] = useState<Currency | null>(null);
  const [selectedReceiveCurrency, setSelectedReceiveCurrency] = useState<Currency | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  
  // Wallet address for receiving payments
  const RECEIVER_ADDRESS = 'UQDa2QRkf7Jj3dYqwRdU7XO6s21WvlvkG-NjUs77htjOMcEI';

  // Define available vouchers
  const vouchers: Voucher[] = [
    {
      id: 1,
      name: "Standard Bonus",
      bonus: 4,
      price: 0.1,
      description: "Get 4% bonus on all your exchanges (limit: 3 transactions)",
      transactionLimit: 3,
      usedTransactions: 0
    },
    {
      id: 2,
      name: "Premium Bonus",
      bonus: 7.5,
      price: 0.1,
      description: "Get 7.5% bonus on all your exchanges (limit: 3 transactions)",
      transactionLimit: 3,
      usedTransactions: 0
    }
  ];

  // Initialize Firebase data and load currencies
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initializeExchangeRates();
        const rate = await loadExchangeRate();
        await loadCurrencies(rate);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
  }, []);

  // Check for referral code in URL
  useEffect(() => {
    const checkReferralCode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        console.log('Referral code found in URL:', ref);
        setReferralCode(ref);
        // Store in localStorage for persistence
        localStorage.setItem('referralCode', ref);
      } else {
        // Check localStorage
        const storedRef = localStorage.getItem('referralCode');
        if (storedRef) {
          console.log('Referral code found in localStorage:', storedRef);
          setReferralCode(storedRef);
        }
      }
    };
    
    checkReferralCode();
  }, []);

  // Load currencies from CoinGecko
  const loadCurrencies = async (tonRate: number) => {
    setIsLoadingCurrencies(true);
    try {
      // Default TON currency
      const defaultCurrencies: Currency[] = [
        {
          id: 'toncoin',
          name: 'Toncoin',
          symbol: 'TON',
          icon: <Diamond className="h-5 w-5 text-blue-400" />,
          rate: tonRate
        },
        {
          id: 'fus',
          name: 'FusToken',
          symbol: 'FUS',
          icon: <Diamond className="h-5 w-5 text-yellow-400" />,
          rate: 1.2
        },
        {
          id: 'usdt',
          name: 'Tether',
          symbol: 'USDT',
          icon: <DollarSign className="h-5 w-5 text-green-400" />,
          rate: 1.0
        }
      ];
      
      // Fetch TON ecosystem coins
      const ecosystemCoins = await fetchTonEcosystemCoins();
      
      // Filter coins with market cap > 5 million
      const highCapCoins = ecosystemCoins.filter(coin => coin.market_cap > 5000000);
      
      // Convert to Currency format
      const additionalCurrencies: Currency[] = highCapCoins.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        icon: <img src={coin.image} alt={coin.symbol} className="h-5 w-5 rounded-full" />,
        rate: coin.current_price
      }));
      
      // Combine currencies, ensuring no duplicates
      const allCurrencies = [
        ...defaultCurrencies,
        ...additionalCurrencies.filter(c => !defaultCurrencies.some(dc => dc.id === c.id))
      ];
      
      setAvailableCurrencies(allCurrencies);
      
      // Set default selected currencies
      if (!selectedSendCurrency) {
        setSelectedSendCurrency(allCurrencies[0]); // TON
      }
      if (!selectedReceiveCurrency) {
        setSelectedReceiveCurrency(allCurrencies.find(c => c.id === 'fus')); // FUS
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  // Load exchange rate from database
  const loadExchangeRate = async () => {
    try {
      const currentRate = await getExchangeRate();
      setTonPrice(currentRate);
      return currentRate;
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      return tonPrice;
    }
  };

  // Handle wallet connection
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await tonConnectUI.connectionRestored;
      setIsConnected(connected);
      
      // If connected, add wallet to database
      if (connected && userFriendlyAddress) {
        console.log('Connection restored, adding wallet to database:', userFriendlyAddress);
        try {
          await addWallet(userFriendlyAddress);
        } catch (error) {
          console.error('Error adding wallet to database:', error);
        }
      }
    };
    
    checkConnection();
  }, [tonConnectUI, userFriendlyAddress]);
  
  // Listen for connection changes
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      const isWalletConnected = !!wallet;
      setIsConnected(isWalletConnected);
      
      // Track connected wallet addresses
      if (isWalletConnected && wallet && wallet.account.address) {
        const address = wallet.account.address;
        console.log('Wallet connected:', address);
        connectedWalletsSet.add(address);
        setConnectedWalletsCount(connectedWalletsSet.size);
        
        // Add wallet to database
        try {
          await addWallet(address);
          console.log('Wallet added to database successfully');
        } catch (error) {
          console.error('Error adding wallet to database:', error);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  // Check for routes
  useEffect(() => {
    const checkRoutes = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setShowAdminLogin(true);
        setShowAdminPanel(false);
        setShowRegisterUserPage(false);
        setShowUserLoginPage(false);
        setShowUserDashboard(false);
        setShowUserCreatePage(false);
      } else if (path === '/register-user') {
        setShowRegisterUserPage(true);
        setShowAdminLogin(false);
        setShowAdminPanel(false);
        setShowUserLoginPage(false);
        setShowUserDashboard(false);
        setShowUserCreatePage(false);
      } else if (path === '/user-login') {
        setShowUserLoginPage(true);
        setShowRegisterUserPage(false);
        setShowAdminLogin(false);
        setShowAdminPanel(false);
        setShowUserDashboard(false);
        setShowUserCreatePage(false);
      } else if (path === '/user-dashboard') {
        setShowUserDashboard(true);
        setShowUserLoginPage(false);
        setShowRegisterUserPage(false);
        setShowAdminLogin(false);
        setShowAdminPanel(false);
        setShowUserCreatePage(false);
      } else if (path === '/user-create') {
        setShowUserCreatePage(true);
        setShowUserDashboard(false);
        setShowUserLoginPage(false);
        setShowRegisterUserPage(false);
        setShowAdminLogin(false);
        setShowAdminPanel(false);
      } else {
        setShowAdminLogin(false);
        setShowAdminPanel(false);
        setShowRegisterUserPage(false);
        setShowUserLoginPage(false);
        setShowUserDashboard(false);
        setShowUserCreatePage(false);
      }
    };
    
    checkRoutes();
    
    // Listen for route changes
    const handleRouteChange = () => {
      checkRoutes();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Calculate receive amount when send amount or currencies change
  useEffect(() => {
    if (!selectedSendCurrency || !selectedReceiveCurrency) return;
    
    const amount = parseFloat(sendAmount) || 0;
    
    // Calculate based on relative rates
    let calculatedAmount = amount * (selectedSendCurrency.rate / selectedReceiveCurrency.rate);
    
    // Apply voucher bonus if active and valid
    if (activeVoucher && (activeVoucher.usedTransactions || 0) < (activeVoucher.transactionLimit || 3)) {
      calculatedAmount *= (1 + activeVoucher.bonus / 100);
    }
    
    // Format based on value
    let formattedAmount: string;
    if (calculatedAmount < 0.01) {
      formattedAmount = calculatedAmount.toFixed(6);
    } else if (calculatedAmount < 1) {
      formattedAmount = calculatedAmount.toFixed(4);
    } else if (calculatedAmount < 10) {
      formattedAmount = calculatedAmount.toFixed(3);
    } else {
      formattedAmount = calculatedAmount.toFixed(2);
    }
    
    setReceiveAmount(formattedAmount);
  }, [sendAmount, selectedSendCurrency, selectedReceiveCurrency, activeVoucher]);

  const handleSendAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setSendAmount(value);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshingRate(true);
    try {
      // Get latest exchange rate from Firebase
      const currentRate = await loadExchangeRate();
      
      // Reload currencies with new rate
      await loadCurrencies(currentRate);
    } catch (error) {
      console.error('Error refreshing exchange rate:', error);
    } finally {
      setIsRefreshingRate(false);
    }
  };

  const purchaseVoucher = async (voucher: Voucher) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsPurchasing(true);

    try {
      // Convert TON to nanoTON (1 TON = 10^9 nanoTON)
      const amountInNanoTons = Math.floor(voucher.price * 1_000_000_000);
      
      // Prepare transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 20, // Valid for 20 minutes
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: amountInNanoTons.toString(),
          },
        ],
      };

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        // Transaction was sent successfully
        const newVoucher = { ...voucher, usedTransactions: 0 };
        setActiveVoucher(newVoucher);
        setShowVoucherModal(false);
        
        // Save to localStorage for persistence
        localStorage.setItem('activeVoucher', JSON.stringify(newVoucher));
        
        // Record transaction in Firebase
        if (userFriendlyAddress) {
          await recordTransaction(
            userFriendlyAddress,
            voucher.price,
            'voucher',
            { voucherId: voucher.id, voucherName: voucher.name }
          );
          
          // Update wallet activity
          await updateWalletActivity(userFriendlyAddress);
        }
        
        // Show success message
        alert(`${voucher.name} purchased and activated! You now get ${voucher.bonus}% bonus on all exchanges (limit: 3 transactions).`);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Failed to purchase voucher. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle swap transaction
  const handleSwap = async () => {
    if (!isConnected) {
      tonConnectUI.openModal();
      return;
    }
    
    if (!selectedSendCurrency || !selectedReceiveCurrency) {
      alert('Please select currencies to swap');
      return;
    }
    
    const amount = parseFloat(sendAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount to swap');
      return;
    }
    
    // Reset error state
    setSwapError(null);
    setIsSwapping(true);
    
    try {
      // For now, we can only send TON through TON Connect
      if (selectedSendCurrency.symbol !== 'TON') {
        setSwapError(`Currently, only sending TON is supported through TON Connect. Please select TON as your send currency.`);
        setIsSwapping(false);
        return;
      }
      
      // Convert TON to nanoTON (1 TON = 10^9 nanoTON)
      const amountInNanoTons = Math.floor(amount * 1_000_000_000);
      
      // Prepare transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 20, // Valid for 20 minutes
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: amountInNanoTons.toString(),
          },
        ],
      };

      // Send transaction through TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        if (selectedReceiveCurrency.symbol === 'FUS') {
          await exchangeTONForFUS(amount, userFriendlyAddress);
        }
        await processSuccessfulSwap(amount);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      setSwapError('Failed to complete swap. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };
  
  // Process successful swap
  const processSuccessfulSwap = async (amount: number) => {
    if (!selectedSendCurrency || !selectedReceiveCurrency || !userFriendlyAddress) return;
    
    // Check if voucher is active and update used transactions
    let voucherApplied = null;
    let bonusApplied = false;
    
    if (activeVoucher) {
      const usedTransactions = activeVoucher.usedTransactions || 0;
      const transactionLimit = activeVoucher.transactionLimit || 3;
      
      if (usedTransactions < transactionLimit) {
        // Voucher is still valid for this transaction
        voucherApplied = activeVoucher.id;
        bonusApplied = true;
        
        // Update voucher used transactions count
        const updatedVoucher = {
          ...activeVoucher,
          usedTransactions: usedTransactions + 1
        };
        
        setActiveVoucher(updatedVoucher);
        localStorage.setItem('activeVoucher', JSON.stringify(updatedVoucher));
        
        // If this was the last transaction, show a notification
        if (usedTransactions + 1 >= transactionLimit) {
          setTimeout(() => {
            alert(`Your ${activeVoucher.name} has been fully used (${transactionLimit}/${transactionLimit} transactions). Purchase a new voucher for more bonuses!`);
          }, 1000);
        }
      } else {
        // Voucher has reached its limit
        bonusApplied = false;
      }
    }
    
    // Process referral if available
    if (referralCode) {
      try {
        const referralSuccess = await recordReferral(referralCode, amount);
        if (referralSuccess) {
          console.log('Referral recorded successfully for code:', referralCode);
        }
      } catch (error) {
        console.error('Error processing referral:', error);
      }
    }
    
  // Record transaction in Firebase
  await recordTransaction(
    userFriendlyAddress,
    amount,
    'swap',
    { 
      fromCurrency: selectedSendCurrency.symbol,
      toCurrency: selectedReceiveCurrency.symbol,
      sendAmount: amount,
      receiveAmount: parseFloat(receiveAmount),
      sendRate: selectedSendCurrency.rate,
      receiveRate: selectedReceiveCurrency.rate,
      voucherApplied: voucherApplied,
      bonusApplied: bonusApplied,
      referralCode: referralCode
    }
  );
  
  // Update wallet swap amount and activity
  await updateWalletSwapAmount(userFriendlyAddress, amount);
  
  // Show success message
  alert(`Swap successful! You will receive ${receiveAmount} ${selectedReceiveCurrency.symbol}.`);
  
  // Reset form
  setSendAmount('0');
};

// Swap the currencies
const handleSwapCurrencies = () => {
  if (selectedSendCurrency && selectedReceiveCurrency) {
    const temp = selectedSendCurrency;
    setSelectedSendCurrency(selectedReceiveCurrency);
    setSelectedReceiveCurrency(temp);
  }
};

// Load saved voucher from localStorage on component mount
useEffect(() => {
  const savedVoucher = localStorage.getItem('activeVoucher');
  if (savedVoucher) {
    try {
      setActiveVoucher(JSON.parse(savedVoucher));
    } catch (e) {
      console.error('Failed to parse saved voucher', e);
      localStorage.removeItem('activeVoucher');
    }
  }
}, []);

// Handle admin login result
const handleAdminLogin = (success: boolean) => {
  if (success) {
    setShowAdminLogin(false);
    setShowAdminPanel(true);
    // Update URL without reloading the page
    window.history.pushState({}, '', '/admin-panel');
  }
};

// Get voucher status text
const getVoucherStatusText = (voucher: Voucher | null): string => {
  if (!voucher) return '';
  
  const usedTransactions = voucher.usedTransactions || 0;
  const transactionLimit = voucher.transactionLimit || 3;
  
  if (usedTransactions >= transactionLimit) {
    return 'Expired';
  }
  
  return `${usedTransactions}/${transactionLimit} used`;
};

// Navigate to user login page
const navigateToUserLogin = () => {
  window.location.href = '/user-login';
};

// If we're showing the admin login page, render only that
if (showAdminLogin) {
  return <AdminLogin onLogin={handleAdminLogin} />;
}

// If we're showing the register user page, render only that
if (showRegisterUserPage) {
  return <UserRegistrationPage />;
}

// If we're showing the user login page, render only that
if (showUserLoginPage) {
  return <UserLoginPage />;
}

// If we're showing the user dashboard, render only that
if (showUserDashboard) {
  return <UserDashboard />;
}

// If we're showing the user create page, render only that
if (showUserCreatePage) {
  return <UserCreatePage />;
}

return (
  <div className="min-h-screen bg-black text-white flex flex-col items-center">
    {/* Header */}
    <header className="w-full p-4 flex justify-between items-center">
      <div className="flex items-center space-x-1">
        <Diamond className="h-5 w-5 text-blue-400" />
        <span className="font-bold">FastSwap</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={navigateToUserLogin}
          className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 mr-2"
        >
          <User className="h-4 w-4" />
          <span>User Login</span>
        </button>
        <TonConnectButton />
      </div>
    </header>

    {/* Main Content */}
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-4">
      <div className="w-full bg-gray-900 rounded-xl p-4 shadow-lg">
        {/* Referral Banner */}
        {referralCode && (
          <div className="mb-3 bg-green-900/30 rounded-lg p-2 text-center">
            <span className="text-sm text-green-400">Using referral code: {referralCode}</span>
          </div>
        )}
        
        {/* Exchange Card */}
        <div className="mb-4 relative">
          <button 
            onClick={handleRefresh} 
            className={`absolute right-2 top-2 p-1 ${isRefreshingRate ? 'text-blue-400 animate-spin' : 'text-gray-400 hover:text-white'}`}
            disabled={isRefreshingRate}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {/* Active Voucher Display */}
          {activeVoucher && (
            <div className={`mb-3 ${
              (activeVoucher.usedTransactions || 0) >= (activeVoucher.transactionLimit || 3)
                ? 'bg-red-900/30'
                : 'bg-blue-900/30'
            } rounded-lg p-2 flex items-center justify-between`}>
              <div className="flex items-center">
                <Ticket className="h-4 w-4 text-blue-400 mr-2" />
                <div>
                  <span className="text-sm">
                    {activeVoucher.name}: {
                      (activeVoucher.usedTransactions || 0) >= (activeVoucher.transactionLimit || 3)
                        ? 'Expired'
                        : `+${activeVoucher.bonus}% bonus`
                    }
                  </span>
                  <div className="text-xs text-gray-400">
                    {getVoucherStatusText(activeVoucher)}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveVoucher(null);
                  localStorage.removeItem('activeVoucher');
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Error Message */}
          {swapError && (
            <div className="mb-3 bg-red-900/30 border border-red-800 rounded-lg p-2 text-center">
              <span className="text-sm text-red-400">{swapError}</span>
            </div>
          )}
          
          {/* TON Only Warning */}
          {selectedSendCurrency && selectedSendCurrency.symbol !== 'TON' && (
            <div className="mb-3 bg-yellow-900/30 border border-yellow-800 rounded-lg p-2">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-yellow-400">
                  Currently, only sending TON is supported through TON Connect. Please select TON as your send currency.
                </span>
              </div>
            </div>
          )}
          
          {/* Send Section */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-1">You send</div>
            <div className="flex items-center bg-gray-800 rounded-lg p-3">
              <input
                type="text"
                value={sendAmount}
                onChange={handleSendAmountChange}
                className="bg-transparent text-2xl w-full outline-none"
              />
              <div className="relative">
                <button 
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg"
                >
                  {selectedSendCurrency ? (
                    <>
                      {selectedSendCurrency.icon}
                      <span>{selectedSendCurrency.symbol}</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <span>Select</span>
                  )}
                </button>
                
                {showCurrencyDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {isLoadingCurrencies ? (
                      <div className="p-3 text-center text-gray-400">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                        Loading...
                      </div>
                    ) : (
                      availableCurrencies.map((currency) => (
                        <button
                          key={currency.id}
                          className={`w-full text-left p-3 flex items-center space-x-2 hover:bg-gray-700 ${
                            selectedSendCurrency?.id === currency.id ? 'bg-blue-900/30' : ''
                          }`}
                          onClick={() => {
                            setSelectedSendCurrency(currency);
                            setShowCurrencyDropdown(false);
                          }}
                        >
                          {currency.icon}
                          <div>
                            <div>{currency.symbol}</div>
                            <div className="text-xs text-gray-400">{currency.name}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedSendCurrency && `$${(parseFloat(sendAmount || '0') * selectedSendCurrency.rate).toFixed(2)}`}
            </div>
          </div>
          
          {/* Arrow */}
          <div className="flex justify-center my-2">
            <button 
              onClick={handleSwapCurrencies}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
            >
              <ArrowDownUp className="text-gray-400" />
            </button>
          </div>
          
          {/* Receive Section */}
          <div>
            <div className="text-sm text-gray-400 mb-1">You receive</div>
            <div className="flex items-center bg-gray-800 rounded-lg p-3">
              <div className="text-2xl w-full">{receiveAmount}</div>
              <div className="relative">
                <button 
                  onClick={() => setShowReceiveCurrencyDropdown(!showReceiveCurrencyDropdown)}
                  className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg"
                >
                  {selectedReceiveCurrency ? (
                    <>
                      {selectedReceiveCurrency.icon}
                      <span>{selectedReceiveCurrency.symbol}</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <span>Select</span>
                  )}
                </button>
                
                {showReceiveCurrencyDropdown && (
                  <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {isLoadingCurrencies ? (
                      <div className="p-3 text-center text-gray-400">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                        Loading...
                      </div>
                    ) : (
                      availableCurrencies.map((currency) => (
                        <button
                          key={currency.id}
                          className={`w-full text-left p-3 flex items-center space-x-2 hover:bg-gray-700 ${
                            selectedReceiveCurrency?.id === currency.id ? 'bg-blue-900/30' : ''
                          }`}
                          onClick={() => {
                            setSelectedReceiveCurrency(currency);
                            setShowReceiveCurrencyDropdown(false);
                          }}
                        >
                          {currency.icon}
                          <div>
                            <div>{currency.symbol}</div>
                            <div className="text-xs text-gray-400">{currency.name}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedReceiveCurrency && `$${(parseFloat(receiveAmount || '0') * selectedReceiveCurrency.rate).toFixed(2)}`}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Connect/Swap Button */}
          <button 
            className={`w-full py-3 rounded-lg text-center font-medium ${
              isSwapping 
                ? 'bg-gray-700 cursor-not-allowed' 
                : isConnected 
                  ? selectedSendCurrency?.symbol !== 'TON'
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={handleSwap}
            disabled={isSwapping || (isConnected && selectedSendCurrency?.symbol !== 'TON')}
          >
            {isSwapping ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                <span>Processing...</span>
              </div>
            ) : !isConnected ? 'Connect Wallet' : 
               selectedSendCurrency?.symbol !== 'TON' ? 'Select TON to Send' : 'Swap'}
          </button>
          
          {/* Voucher Button - Only show when connected */}
          {isConnected && (
            <button 
              className="w-full py-3 rounded-lg text-center font-medium bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center"
              onClick={() => setShowVoucherModal(true)}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {activeVoucher ? 'Change Voucher' : 'Buy Voucher'}
            </button>
          )}
        </div>
        
        {/* Disclaimer */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>All transactions are processed through TON Connect.</p>
          <p className="mt-1">Currently, only TON can be sent directly through the wallet.</p>
        </div>
      </div>
    </div>

    {/* Voucher Modal */}
    {showVoucherModal && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl p-5 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Select a Voucher</h3>
            <button 
              onClick={() => setShowVoucherModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {vouchers.map((voucher) => (
              <div 
                key={voucher.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeVoucher?.id === voucher.id 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{voucher.name}</h4>
                  <div className="bg-blue-900/50 px-2 py-1 rounded text-sm">
                    +{voucher.bonus}%
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3">{voucher.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-blue-400">
                    <Diamond className="h-4 w-4 mr-1" />
                    <span>{voucher.price} TON</span>
                  </div>
                  <button 
                    className={`px-3 py-1 rounded-lg text-sm ${
                      isPurchasing && activeVoucher?.id === voucher.id
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={() => purchaseVoucher(voucher)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing && activeVoucher?.id === voucher.id
                      ? 'Processing...'
                      : activeVoucher?.id === voucher.id
                      ? `Active (${getVoucherStatusText(activeVoucher)})`
                      : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Vouchers are applied automatically to all future exchanges (limit: 3 transactions per voucher)
          </div>
        </div>
      </div>
    )}

    {/* Admin Panel */}
    {showAdminPanel && (
      <AdminPanel onClose={() => {
        setShowAdminPanel(false);
        // Update URL without reloading the page
        window.history.pushState({}, '', '/');
      }} />
    )}

    {/* Footer */}
    <footer className="w-full p-4 text-center text-gray-500 text-sm">
      <div className="mb-1">SUPPORT</div>
      <div>Copyright © 2023 FastSwap</div>
    </footer>
  </div>
);
}

export default App;
