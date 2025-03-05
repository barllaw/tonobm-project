import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9YEyxnlq1zmtK9qZAw_QwuGi_wzJiOFU",
  authDomain: "exchange-a58be.firebaseapp.com",
  projectId: "exchange-a58be",
  storageBucket: "exchange-a58be.firebasestorage.app",
  messagingSenderId: "638799595343",
  appId: "1:638799595343:web:c569d7d9569e98f1f7673a",
  measurementId: "G-8M9C74JHTS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };