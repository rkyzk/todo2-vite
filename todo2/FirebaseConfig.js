/* FirebaseConfig.js */
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import "./FirebaseConfig";
import process from "process";
window.process = process;

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: "todo-d65e7",
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messageSenderId,
  apiId: process.env.apiId,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
