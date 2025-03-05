// Define types for the application

export interface Voucher {
  id: number;
  name: string;
  bonus: number;
  price: number;
  description: string;
  transactionLimit?: number;
  usedTransactions?: number;
}

export interface WalletData {
  address: string;
  lastActive: string;
  totalSwapped: number;
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  rate: number;
  updatedAt: string;
}

export interface VoucherRate {
  id: string;
  name: string;
  bonus: number;
  price: number;
  updatedAt: string;
}

export interface Coin {
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

export interface User {
  id: string;
  username: string;
  email: string;
  referralCode: string;
  referrals: number;
  totalCommission: number;
  commissionRate?: number;
  createdAt: string;
}

export interface ReferralTransaction {
  id: string;
  userId: string;
  referralCode: string;
  referredWallet: string;
  amount: number;
  commission: number;
  commissionRate: number;
  timestamp: string;
}