

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:  process.env.VUE_APP_FIREBASE_API_KEY || "AIzaSyAsJX3zfJF_5Yaa_VdF8UgXpDBZzT1CRXw",
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || "job-on-go.firebaseapp.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || "job-on-go",
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || "job-on-go.appspot.com",
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || "246677251453",
  appId: process.env.VUE_APP_FIREBASE_APP_ID || "1:246677251453:web:3c9840f221393c68fbd814",
};
console.log(process.env.FIRE_API_KEY);
const app = initializeApp(firebaseConfig);

 const auth = getAuth(app);
 const db = getFirestore(app);
 const firedb = getDatabase(app);
 const storage = getStorage(app);
 const analytics = getAnalytics(app);
export { db, auth, storage, analytics, firedb };

