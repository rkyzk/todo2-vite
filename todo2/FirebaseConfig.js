/* FirebaseConfig.js */
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// var process = Node.js?.process;

const firebaseConfig = {
  apiKey: "AIzaSyA7SN3RCtxQJ-Pi99-fH8EnjpT03yVK1CM",
  authDomain: "todo-d65e7.firebaseapp.com",
  databaseURL:
    "https://todo-d65e7-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "todo-d65e7",
  storageBucket: "todo-d65e7.appspot.com",
  messagingSenderId: "1097177670956",
  apiId: "1:1097177670956:web:01eff60acd54e7e79a7889",
  // mesurementId: process.env.REACT_MESUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
