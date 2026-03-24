import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { isSupported, getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACfvD6NyEByyxnqlWmJcPY0FHIzwy_N8o",
  authDomain: "web-keuangan-fcc15.firebaseapp.com",
  databaseURL: "https://web-keuangan-fcc15-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-keuangan-fcc15",
  storageBucket: "web-keuangan-fcc15.firebasestorage.app",
  messagingSenderId: "358164304100",
  appId: "1:358164304100:web:1be9ace679588142025cf1",
  measurementId: "G-V0Z8T8PDC9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Safe Analytics initialization
export let analytics = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
}).catch(err => console.error("Analytics initialization failed:", err));
