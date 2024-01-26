/* FirebaseConfig.js */
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import "./FirebaseConfig";

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messageSenderId,
  apiId: process.env.apiId,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
