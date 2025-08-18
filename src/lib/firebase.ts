
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "kuwaity-farm",
  "appId": "1:433160071015:web:2a2434f18a7fdc7bddb1c2",
  "storageBucket": "kuwaity-farm.firebasestorage.app",
  "apiKey": "AIzaSyCLB7Dfw5jpDQsVvep-OWVeNv9Hq_nQZSs",
  "authDomain": "kuwaity-farm.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "433160071015"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
