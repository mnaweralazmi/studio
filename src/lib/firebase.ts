// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  serverTimestamp as firestoreServerTimestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// WARNING: THIS IS A PUBLIC, BROWSER-SIDE CONFIGURATION
// ANYONE CAN VIEW THIS INFORMATION. SECURITY MUST BE ENFORCED
// BY FIRESTORE SECURITY RULES AND FIREBASE APP CHECK.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // استخدم القيمة من مشروعك
  authDomain: "YOUR_AUTH_DOMAIN_HERE", // استخدم القيمة من مشروعك
  projectId: "YOUR_PROJECT_ID_HERE", // استخدم القيمة من مشروعك
  storageBucket: "YOUR_STORAGE_BUCKET_HERE", // استخدم القيمة من مشروعك
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE", // استخدم القيمة من مشروعك
  appId: "YOUR_APP_ID_HERE", // استخدم القيمة من مشروعك
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const serverTimestamp = firestoreServerTimestamp;

export { app, auth, db, storage, serverTimestamp };
