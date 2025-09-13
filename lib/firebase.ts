import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'kuwaity-farm',
  appId: '1:433160071015:web:2a2434f18a7fdc7bddb1c2',
  storageBucket: 'kuwaity-farm.appspot.com',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'kuwaity-farm.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '433160071015',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// NOTE: To get admin privileges, add your Firebase User ID (UID) to this array.
// You can find your UID in the "Settings" page of the app after logging in.
// Example: export const adminUids = ['YOUR_UID_HERE', 'ANOTHER_ADMIN_UID_HERE'];
export const adminUids = ['l8M3vFpBqNg0dKda2RxmjcizOjg2', 'JU2IAJu8XEeCqM33bu1wzlrA7id2'];


export { app, auth, db, storage };
