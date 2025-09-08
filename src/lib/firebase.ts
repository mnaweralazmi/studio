
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// WARNING: THIS IS A PUBLIC, BROWSER-SIDE CONFIGURATION
// ANYONE CAN VIEW THIS INFORMATION. SECURITY MUST BE ENFORCED
// BY FIRESTORE SECURITY RULES AND FIREBASE APP CHECK.
const firebaseConfig = {
  "projectId": "kuwaity-farm",
  "appId": "1:433160071015:web:2a2434f18a7fdc7bddb1c2",
  "storageBucket": "kuwaity-farm.appspot.com",
  "apiKey": "AIzaSyCLB7Dfw5jpDQsVvep-OWVeNv9Hq_nQZSs",
  "authDomain": "kuwaity-farm.firebaseapp.com",
  "messagingSenderId": "433160071015"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
