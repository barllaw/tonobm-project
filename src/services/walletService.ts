import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, Timestamp, serverTimestamp, setDoc } from 'firebase/firestore';
import { WalletData } from '../types';

// Collection references
const WALLETS_COLLECTION = 'wallets';

// Add a new wallet to the database
export const addWallet = async (address: string): Promise<string> => {
  try {
    console.log('Adding wallet to database:', address);
    
    // Check if wallet already exists
    const walletExists = await checkWalletExists(address);
    
    if (walletExists) {
      console.log('Wallet already exists, updating last active time');
      // Update last active time
      await updateWalletActivity(address);
      return 'Wallet already exists';
    }
    
    console.log('Creating new wallet document');
    // Create new wallet document
    const walletData = {
      address,
      lastActive: serverTimestamp(),
      totalSwapped: 0,
      createdAt: serverTimestamp()
    };
    
    // Use setDoc with a custom ID to ensure we don't create duplicates
    const docRef = doc(db, WALLETS_COLLECTION, address.replace(/[^a-zA-Z0-9]/g, ''));
    await setDoc(docRef, walletData);
    console.log('Wallet added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding wallet:', error);
    throw error;
  }
};

// Check if a wallet already exists
export const checkWalletExists = async (address: string): Promise<boolean> => {
  try {
    console.log('Checking if wallet exists:', address);
    const q = query(collection(db, WALLETS_COLLECTION), where('address', '==', address));
    const querySnapshot = await getDocs(q);
    const exists = !querySnapshot.empty;
    console.log('Wallet exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking wallet:', error);
    throw error;
  }
};

// Update wallet activity timestamp
export const updateWalletActivity = async (address: string): Promise<void> => {
  try {
    console.log('Updating wallet activity for:', address);
    const q = query(collection(db, WALLETS_COLLECTION), where('address', '==', address));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const walletDoc = querySnapshot.docs[0];
      console.log('Found wallet document, updating lastActive');
      await updateDoc(doc(db, WALLETS_COLLECTION, walletDoc.id), {
        lastActive: serverTimestamp()
      });
    } else {
      console.log('Wallet not found, creating new document');
      await addWallet(address);
    }
  } catch (error) {
    console.error('Error updating wallet activity:', error);
    throw error;
  }
};

// Update wallet swap amount
export const updateWalletSwapAmount = async (address: string, amount: number): Promise<void> => {
  try {
    console.log('Updating wallet swap amount for:', address, 'amount:', amount);
    const q = query(collection(db, WALLETS_COLLECTION), where('address', '==', address));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const walletDoc = querySnapshot.docs[0];
      const currentData = walletDoc.data();
      
      console.log('Found wallet document, updating totalSwapped');
      await updateDoc(doc(db, WALLETS_COLLECTION, walletDoc.id), {
        totalSwapped: (currentData.totalSwapped || 0) + amount,
        lastActive: serverTimestamp()
      });
    } else {
      console.log('Wallet not found for swap update, creating new document');
      // Create new wallet with initial swap amount
      const walletData = {
        address,
        lastActive: serverTimestamp(),
        totalSwapped: amount,
        createdAt: serverTimestamp()
      };
      
      const docRef = doc(db, WALLETS_COLLECTION, address.replace(/[^a-zA-Z0-9]/g, ''));
      await setDoc(docRef, walletData);
    }
  } catch (error) {
    console.error('Error updating wallet swap amount:', error);
    throw error;
  }
};

// Get all wallets
export const getAllWallets = async (): Promise<WalletData[]> => {
  try {
    console.log('Getting all wallets');
    const querySnapshot = await getDocs(collection(db, WALLETS_COLLECTION));
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamps to strings
      const lastActive = data.lastActive instanceof Timestamp 
        ? data.lastActive.toDate().toISOString() 
        : new Date().toISOString();
        
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : new Date().toISOString();
      
      return {
        address: data.address,
        lastActive,
        totalSwapped: data.totalSwapped || 0,
        createdAt
      };
    });
  } catch (error) {
    console.error('Error getting wallets:', error);
    throw error;
  }
};

// Get wallet count
export const getWalletCount = async (): Promise<number> => {
  try {
    console.log('Getting wallet count');
    const querySnapshot = await getDocs(collection(db, WALLETS_COLLECTION));
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting wallet count:', error);
    throw error;
  }
};