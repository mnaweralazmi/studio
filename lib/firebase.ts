import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'kuwaity-farm',
  appId: '1:433160071015:web:2a2434f18a7fdc7bddb1c2',
  storageBucket: 'kuwaity-farm.firebasestorage.app',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'kuwaity-farm.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '433160071015',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// NOTE: In a real-world application, this should be stored securely in Firestore
// and managed via a secure backend or Firebase Functions.
// For this prototype, we are hardcoding the admin UIDs.
// Replace 'YOUR_ADMIN_UID_HERE' with your actual Firebase User ID.
export const adminUids = ['YOUR_ADMIN_UID_HERE'];


export { app, auth, db };
