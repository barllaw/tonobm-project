import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, setDoc, increment } from 'firebase/firestore';
import { User, ReferralTransaction } from '../types';

// Collection references
const USERS_COLLECTION = 'users';
const REFERRAL_TRANSACTIONS_COLLECTION = 'referralTransactions';
const USER_PASSWORDS_COLLECTION = 'userPasswords';

// Generate a unique referral code
const generateReferralCode = (username: string): string => {
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const usernamePart = username.substring(0, 3).toUpperCase();
  return `${usernamePart}-${randomPart}`;
};

// Register a new user
export const registerUser = async (username: string, email: string): Promise<User> => {
  try {
    console.log('Registering new user:', username, email);
    
    // Check if user with this email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      throw new Error('A user with this email already exists');
    }
    
    // Generate a unique referral code
    const referralCode = generateReferralCode(username);
    
    // Create user document
    const userData = {
      username,
      email,
      referralCode,
      referrals: 0,
      totalCommission: 0,
      commissionRate: 5, // Default commission rate is 5%
      createdAt: serverTimestamp()
    };
    
    // Add user to database
    const docRef = await addDoc(collection(db, USERS_COLLECTION), userData);
    
    console.log('User registered successfully with ID:', docRef.id);
    
    // Return the created user
    return {
      id: docRef.id,
      ...userData,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Create a new user (for public registration)
export const createUser = async (username: string, email: string, password: string): Promise<User> => {
  try {
    console.log('Creating new user:', username, email);
    
    // Check if user with this email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      throw new Error('A user with this email already exists');
    }
    
    // Register the user
    const user = await registerUser(username, email);
    
    // Set the password
    await setUserPassword(user.id, password);
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Set user password
export const setUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    console.log('Setting password for user:', userId);
    
    // Store password in a separate collection for security
    await setDoc(doc(db, USER_PASSWORDS_COLLECTION, userId), {
      password: password,
      updatedAt: serverTimestamp()
    });
    
    console.log('Password set successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('Error setting user password:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('Logging in user with email:', email);
    
    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('No user found with email:', email);
      return false;
    }
    
    // Get stored password
    const passwordDoc = await getDocs(query(collection(db, USER_PASSWORDS_COLLECTION), where('__name__', '==', user.id)));
    
    if (passwordDoc.empty) {
      console.log('No password found for user:', user.id);
      return false;
    }
    
    const storedPassword = passwordDoc.docs[0].data().password;
    
    // Compare passwords
    if (password === storedPassword) {
      // Store user info in localStorage for session management
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error logging in:', error);
    return false;
  }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    console.log('Logging out user');
    localStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      return null;
    }
    
    const user = JSON.parse(userJson);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    console.log('Checking if email exists:', email);
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    const exists = !querySnapshot.empty;
    console.log('Email exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    console.log('Getting user by email:', email);
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No user found with email:', email);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      username: data.username || '',
      email: data.email || '',
      referralCode: data.referralCode || '',
      referrals: data.referrals || 0,
      totalCommission: data.totalCommission || 0,
      commissionRate: data.commissionRate || 5,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log('Getting all users');
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username || '',
        email: data.email || '',
        referralCode: data.referralCode || '',
        referrals: data.referrals || 0,
        totalCommission: data.totalCommission || 0,
        commissionRate: data.commissionRate || 5,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
    
    console.log('Users found:', users.length);
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Get user by referral code
export const getUserByReferralCode = async (referralCode: string): Promise<User | null> => {
  try {
    console.log('Getting user by referral code:', referralCode);
    const q = query(collection(db, USERS_COLLECTION), where('referralCode', '==', referralCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No user found with referral code:', referralCode);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      username: data.username || '',
      email: data.email || '',
      referralCode: data.referralCode || '',
      referrals: data.referrals || 0,
      totalCommission: data.totalCommission || 0,
      commissionRate: data.commissionRate || 5,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user by referral code:', error);
    throw error;
  }
};

// Record a referral
export const recordReferral = async (referralCode: string, amount: number): Promise<boolean> => {
  try {
    console.log('Recording referral for code:', referralCode, 'amount:', amount);
    const user = await getUserByReferralCode(referralCode);
    
    if (!user) {
      console.log('No user found with referral code:', referralCode);
      return false;
    }
    
    // Calculate commission based on user's commission rate
    const commissionRate = user.commissionRate || 5;
    const commission = amount * (commissionRate / 100);
    
    // Update user's referral stats
    await updateDoc(doc(db, USERS_COLLECTION, user.id), {
      referrals: increment(1),
      totalCommission: increment(commission)
    });
    
    // Record the referral transaction
    await addDoc(collection(db, REFERRAL_TRANSACTIONS_COLLECTION), {
      userId: user.id,
      referralCode: referralCode,
      referredWallet: 'Anonymous Wallet', // In a real app, you would store the actual wallet
      amount: amount,
      commission: commission,
      commissionRate: commissionRate,
      timestamp: serverTimestamp()
    });
    
    console.log('Referral recorded successfully with commission rate:', commissionRate, '%');
    return true;
  } catch (error) {
    console.error('Error recording referral:', error);
    throw error;
  }
};

// Update user's commission rate
export const updateUserCommissionRate = async (userId: string, commissionRate: number): Promise<void> => {
  try {
    console.log('Updating commission rate for user:', userId, 'to:', commissionRate);
    
    // Validate commission rate
    if (commissionRate < 0 || commissionRate > 100) {
      throw new Error('Commission rate must be between 0 and 100');
    }
    
    // Update user document
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      commissionRate: commissionRate
    });
    
    console.log('Commission rate updated successfully');
  } catch (error) {
    console.error('Error updating commission rate:', error);
    throw error;
  }
};

// Update user's referral code
export const updateUserReferralCode = async (userId: string, referralCode: string): Promise<void> => {
  try {
    console.log('Updating referral code for user:', userId, 'to:', referralCode);
    
    // Validate referral code
    if (!referralCode || referralCode.length < 5) {
      throw new Error('Referral code must be at least 5 characters long');
    }
    
    // Check if the code is already in use
    const existingUser = await getUserByReferralCode(referralCode);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('This referral code is already in use by another user');
    }
    
    // Update user document
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      referralCode: referralCode
    });
    
    console.log('Referral code updated successfully');
    
    // Update the user in localStorage if this is the current user
    const currentUserJson = localStorage.getItem('currentUser');
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.id === userId) {
        currentUser.referralCode = referralCode;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    }
  } catch (error) {
    console.error('Error updating referral code:', error);
    throw error;
  }
};

// Get user referrals
export const getUserReferrals = async (userId: string): Promise<number> => {
  try {
    console.log('Getting referrals for user:', userId);
    const userDoc = await doc(db, USERS_COLLECTION, userId);
    const userSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), where('__name__', '==', userId)));
    
    if (userSnapshot.empty) {
      console.log('No user found with ID:', userId);
      return 0;
    }
    
    const userData = userSnapshot.docs[0].data();
    return userData.referrals || 0;
  } catch (error) {
    console.error('Error getting user referrals:', error);
    return 0;
  }
};

// Get user transactions
export const getUserTransactions = async (userId: string): Promise<ReferralTransaction[]> => {
  try {
    console.log('Getting transactions for user:', userId);
    const q = query(
      collection(db, REFERRAL_TRANSACTIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No transactions found for user:', userId);
      return getMockTransactions(userId);
    }
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        referralCode: data.referralCode,
        referredWallet: data.referredWallet,
        amount: data.amount,
        commission: data.commission,
        commissionRate: data.commissionRate,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
    
    console.log('Transactions found:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return getMockTransactions(userId);
  }
};

// Generate mock transactions for testing
const getMockTransactions = (userId: string): ReferralTransaction[] => {
  const now = new Date();
  
  return [
    {
      id: 'tx_mock_1',
      userId: userId,
      referralCode: 'MOCK123',
      referredWallet: 'UQDa2QRkf7Jj3dYqwRdU7XO6s21WvlvkG-NjUs77htjOMcEI',
      amount: 1.5,
      commission: 0.075,
      commissionRate: 5,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: 'tx_mock_2',
      userId: userId,
      referralCode: 'MOCK123',
      referredWallet: 'UQBzn4bEZwVZU-VPnKYh66SzKiMbALNpS15GNxpD_5oXPkbS',
      amount: 3.2,
      commission: 0.16,
      commissionRate: 5,
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
      id: 'tx_mock_3',
      userId: userId,
      referralCode: 'MOCK123',
      referredWallet: 'UQCy5M8dF6Hh4HL-Nznz5r3wGFSbBXYgBZUVCxLH8J33WQwt',
      amount: 0.8,
      commission: 0.04,
      commissionRate: 5,
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }
  ];
};