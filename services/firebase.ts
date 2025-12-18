import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcngihg24XynE0fmRoGkW5aazEVjlIBKI",
  authDomain: "thinkthrift-9c519.firebaseapp.com",
  projectId: "thinkthrift-9c519",
  storageBucket: "thinkthrift-9c519.firebasestorage.app",
  messagingSenderId: "749757357442",
  appId: "1:749757357442:web:2790133092c26012ec039b"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db };