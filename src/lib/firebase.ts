// src/lib/api/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  serverTimestamp as firestoreServerTimestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCLB7Dfw5jpDQsVvep-OWVeNv9Hq_nQZSs",
  authDomain: "kuwaity-farm.firebaseapp.com",
  projectId: "kuwaity-farm",
  storageBucket: "kuwaity-farm.appspot.com",
  messagingSenderId: "433160071015",
  appId: "1:433160071015:web:2a2434f18a7fdc7bddb1c2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const serverTimestamp = firestoreServerTimestamp;

export { app, auth, db, storage, serverTimestamp };
export default db;
