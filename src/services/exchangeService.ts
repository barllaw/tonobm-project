import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, orderBy, limit, setDoc } from 'firebase/firestore';
import { ExchangeRate, VoucherRate } from '../types';
import TonWeb from 'tonweb';
import { Buffer } from 'buffer'; // Імпорт Buffer

// Колекції
const EXCHANGE_RATES_COLLECTION = 'exchangeRates';
const VOUCHER_RATES_COLLECTION = 'voucherRates';
const TRANSACTIONS_COLLECTION = 'transactions';

// Адреса вашого смарт-контракту
const contractAddress = new TonWeb.utils.Address('EQBJWL7h_VZds8FjLZLh_u0rXCMlSkvlPU88bwG4qs4EF7_P');

// Імпорти ABI файлів
import sampleJettonABI from '../../tact_samplejetton.abi.json';
import jettonDefaultWalletABI from '../../tact_jettondefaultwallet.abi.json';

// Підключення до контракту
const tonweb = new TonWeb();
const sampleJettonContract = new tonweb.Contract(sampleJettonABI, contractAddress);

// Функція для обміну TON на ваш токен
export async function exchangeTONForToken(amountTON: number, userAddress: string): Promise<any> {
    try {
        const result = await sampleJettonContract.methods.exchange({
            amount: amountTON,
            user: userAddress
        }).send();
        console.log('Exchange successful:', result);
        return result;
    } catch (error) {
        console.error('Exchange failed:', error);
        throw error;
    }
}

// Новий функціонал для обміну TON на токен FUS через смарт-контракт
export async function exchangeTONForFUS(amountTON: number, userAddress: string): Promise<any> {
    try {
        const result = await sampleJettonContract.methods.exchange({
            amount: amountTON,
            user: userAddress
        }).send();
        console.log('Exchange successful:', result);
        return result;
    } catch (error) {
        console.error('Exchange failed:', error);
        throw error;
    }
}

// Початковий курс обміну
const DEFAULT_TON_USDT_RATE = 3.5;
const DEFAULT_TON_FUS_RATE = 1.2; // Початковий курс обміну для FUS

// Початкові курси ваучерів
const DEFAULT_VOUCHER_RATES = [
  {
    name: "Standard Bonus",
    bonus: 4,
    price: 0.1
  },
  {
    name: "Premium Bonus",
    bonus: 7.5,
    price: 0.1
  }
];

// Ініціалізація курсів обміну, якщо вони не існують
export const initializeExchangeRates = async (): Promise<void> => {
  try {
    console.log('Initializing exchange rates');
    
    // Перевірка, чи існує курс обміну
    const ratesQuery = query(collection(db, EXCHANGE_RATES_COLLECTION));
    const ratesSnapshot = await getDocs(ratesQuery);
    
    if (ratesSnapshot.empty) {
      console.log('No exchange rates found, adding default rate');
      // Додавання початкового курсу TON до USDT
      await setDoc(doc(db, EXCHANGE_RATES_COLLECTION, 'TON_USDT'), {
        pair: 'TON_USDT',
        rate: DEFAULT_TON_USDT_RATE,
        updatedAt: serverTimestamp()
      });
      
      // Додавання початкового курсу TON до FUS
      await setDoc(doc(db, EXCHANGE_RATES_COLLECTION, 'TON_FUS'), {
        pair: 'TON_FUS',
        rate: DEFAULT_TON_FUS_RATE,
        updatedAt: serverTimestamp()
      });
    }
    
    // Перевірка, чи існують курси ваучерів
    const voucherQuery = query(collection(db, VOUCHER_RATES_COLLECTION));
    const voucherSnapshot = await getDocs(voucherQuery);
    
    if (voucherSnapshot.empty) {
      console.log('No voucher rates found, adding default vouchers');
      // Додавання початкових курсів ваучерів
      for (let i = 0; i < DEFAULT_VOUCHER_RATES.length; i++) {
        const voucher = DEFAULT_VOUCHER_RATES[i];
        await setDoc(doc(db, VOUCHER_RATES_COLLECTION, `voucher_${i+1}`), {
          ...voucher,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // Ініціалізація колекції транзакцій, якщо вона не існує
    try {
      const transactionsQuery = query(collection(db, TRANSACTIONS_COLLECTION));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      if (transactionsSnapshot.empty) {
        console.log('No transactions found, adding sample transactions');
        // Додавання зразкових транзакцій для демонстрації
        const sampleTransactions = getMockTransactions(3);
        for (const transaction of sampleTransactions) {
          const { id, ...transactionData } = transaction;
          await setDoc(doc(db, TRANSACTIONS_COLLECTION, id), {
            ...transactionData,
            timestamp: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error initializing transactions:', error);
    }
    
    console.log('Exchange rates initialized successfully');
  } catch (error) {
    console.error('Error initializing exchange rates:', error);
    throw error;
  }
};

// Отримати поточний курс обміну
export const getExchangeRate = async (pair: string = 'TON_USDT'): Promise<number> => {
  try {
    console.log('Getting exchange rate for pair:', pair);
    
    // Спочатку спробуйте отримати документ безпосередньо за ID
    const docRef = doc(db, EXCHANGE_RATES_COLLECTION, pair);
    const docSnap = await getDocs(query(collection(db, EXCHANGE_RATES_COLLECTION), where('pair', '==', pair)));
    
    if (!docSnap.empty) {
      const rate = docSnap.docs[0].data().rate;
      console.log('Exchange rate found:', rate);
      return rate;
    }
    
    console.log('No exchange rate found with direct ID, trying query');
    
    // Якщо не знайдено, спробуйте підхід із запитом
    const q = query(
      collection(db, EXCHANGE_RATES_COLLECTION),
      where('pair', '==', pair)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No exchange rate found, returning default rate');
      return pair === 'TON_FUS' ? DEFAULT_TON_FUS_RATE : DEFAULT_TON_USDT_RATE;
    }
    
    const rate = querySnapshot.docs[0].data().rate;
    console.log('Exchange rate found:', rate);
    return rate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return pair === 'TON_FUS' ? DEFAULT_TON_FUS_RATE : DEFAULT_TON_USDT_RATE;
  }
};

// Оновити курс обміну
export const updateExchangeRate = async (pair: string, rate: number): Promise<void> => {
  try {
    console.log('Updating exchange rate for pair:', pair, 'to:', rate);
    
    // Спочатку перевірте, чи існує документ
    const q = query(collection(db, EXCHANGE_RATES_COLLECTION), where('pair', '==', pair));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Оновлення існуючого документа
      const docId = querySnapshot.docs[0].id;
      console.log('Updating existing exchange rate document with ID:', docId);
      
      await updateDoc(doc(db, EXCHANGE_RATES_COLLECTION, docId), {
        rate,
        updatedAt: serverTimestamp()
      });
    } else {
      // Створення нового документа
      console.log('Creating new exchange rate document');
      await addDoc(collection(db, EXCHANGE_RATES_COLLECTION), {
        pair,
        rate,
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('Exchange rate updated successfully');
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    throw error;
  }
};

// Отримати курси ваучерів
export const getVoucherRates = async (): Promise<VoucherRate[]> => {
  try {
    console.log('Getting voucher rates');
    const querySnapshot = await getDocs(collection(db, VOUCHER_RATES_COLLECTION));
    
    const rates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        bonus: data.bonus,
        price: data.price,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
    
    console.log('Voucher rates found:', rates.length);
    return rates;
  } catch (error) {
    console.error('Error getting voucher rates:', error);
    return [];
  }
};

// Оновити курс ваучера
export const updateVoucherRate = async (id: string, bonus: number): Promise<void> => {
  try {
    console.log('Updating voucher rate for ID:', id, 'to bonus:', bonus);
    await updateDoc(doc(db, VOUCHER_RATES_COLLECTION, id), {
      bonus,
      updatedAt: serverTimestamp()
    });
    console.log('Voucher rate updated successfully');
  } catch (error) {
    console.error('Error updating voucher rate:', error);
    throw error;
  }
};

// Записати транзакцію
export const recordTransaction = async (
  walletAddress: string, 
  amount: number, 
  type: 'swap' | 'voucher',
  details?: any
): Promise<void> => {
  try {
    console.log('Recording transaction for wallet:', walletAddress, 'type:', type, 'amount:', amount);
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await setDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId), {
      walletAddress,
      amount,
      type,
      details,
      timestamp: serverTimestamp()
    });
    
    console.log('Transaction recorded successfully with ID:', transactionId);
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
};

// Отримати кількість транзакцій
export const getTransactionCount = async (): Promise<number> => {
  try {
    console.log('Getting transaction count');
    const querySnapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    const count = querySnapshot.size;
    console.log('Transaction count:', count);
    return count;
  } catch (error) {
    console.error('Error getting transaction count:', error);
    return 0;
  }
};

// Отримати загальний обсяг
export const getTotalVolume = async (): Promise<number> => {
  try {
    console.log('Getting total volume');
    const querySnapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    
    let totalVolume = 0;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      totalVolume += data.amount || 0;
    });
    
    console.log('Total volume:', totalVolume);
    return totalVolume;
  } catch (error) {
    console.error('Error getting total volume:', error);
    return 0;
  }
};

// Отримати останні транзакції
export const getRecentTransactions = async (limit: number = 5): Promise<any[]> => {
  try {
    console.log('Getting recent transactions, limit:', limit);
    
    // Створення простого запиту без orderBy спочатку для перевірки, чи існує колекція
    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
    const simpleQuery = query(transactionsRef, limit(limit));
    
    try {
      const simpleSnapshot = await getDocs(simpleQuery);
      
      // Якщо у нас є транзакції, спробуйте з orderBy
      if (!simpleSnapshot.empty) {
        try {
          // Тепер спробуйте з orderBy
          const orderedQuery = query(
            transactionsRef,
            orderBy('timestamp', 'desc'),
            limit(limit)
          );
          
          const querySnapshot = await getDocs(orderedQuery);
          
          const transactions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              walletAddress: data.walletAddress || 'Unknown',
              amount: data.amount || 0,
              type: data.type || 'unknown',
              details: data.details || {},
              timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
            };
          });
          
          console.log('Transactions found in database:', transactions.length);
          return transactions;
        } catch (orderError) {
          console.error('Error with ordered query:', orderError);
          
          // Якщо orderBy не вдається, поверніть результати простого запиту
          const transactions = simpleSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              walletAddress: data.walletAddress || 'Unknown',
              amount: data.amount || 0,
              type: data.type || 'unknown',
              details: data.details || {},
              timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
            };
          });
          
          console.log('Returning transactions without ordering:', transactions.length);
          return transactions;
        }
      } else {
        console.log('No transactions found in database');
        return getMockTransactions(limit);
      }
    } catch (firestoreError) {
      console.error('Firestore error getting transactions:', firestoreError);
      return getMockTransactions(limit);
    }
  } catch (error) {
    console.error('Error getting transactions:', error);
    return getMockTransactions(limit);
  }
};

// Генерація зразкових транзакцій для тестування
const getMockTransactions = (limit: number = 5): any[] => {
  const mockTransactions = [
    {
      id: 'tx_1',
      walletAddress: 'UQDa2QRkf7Jj3dYqwRdU7XO6s21WvlvkG-NjUs77htjOMcEI',
      amount: 1.5,
      type: 'swap',
      details: { fromCurrency: 'TON', toCurrency: 'USDT' },
      timestamp: new Date(Date.now() - 30 * 60000).toISOString() // 30 хвилин тому
    },
    {
      id: 'tx_2',
      walletAddress: 'UQBzn4bEZwVZU-VPnKYh66SzKiMbALNpS15GNxpD_5oXPkbS',
      amount: 0.1,
      type: 'voucher',
      details: { voucherName: 'Standard Bonus' },
      timestamp: new Date(Date.now() - 120 * 60000).toISOString() // 2 години тому
    },
    {
      id: 'tx_3',
      walletAddress: 'UQBzn4bEZwVZU-VPnKYh66SzKiMbALNpS15GNxpD_5oXPkbS',
      amount: 2.0,
      type: 'swap',
      details: { fromCurrency: 'TON', toCurrency: 'USDT' },
      timestamp: new Date(Date.now() - 180 * 60000).toISOString() // 3 години тому
    },
    {
      id: 'tx_4',
      walletAddress: 'UQCy5M8dF6Hh4HL-Nznz5r3wGFSbBXYgBZUVCxLH8J33WQwt',
      amount: 0.5,
      type: 'swap',
      details: { fromCurrency: 'TON', toCurrency: 'USDT' },
      timestamp: new Date(Date.now() - 240 * 60000).toISOString() // 4 години тому
    },
    {
      id: 'tx_5',
      walletAddress: 'UQCy5M8dF6Hh4HL-Nznz5r3wGFSbBXYgBZUVCxLH8J33WQwt',
      amount: 0.1,
      type: 'voucher',
      details: { voucherName: 'Premium Bonus' },
      timestamp: new Date(Date.now() - 300 * 60000).toISOString() // 5 годин тому
    }
  ];
  
  return mockTransactions.slice(0, limit);
};