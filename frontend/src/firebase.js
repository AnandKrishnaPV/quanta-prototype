import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD48NAkS71tmUYSXdyzZgsXnVPkgamKCjY",
  authDomain: "quanta-b4649.firebaseapp.com",
  projectId: "quanta-b4649",
  storageBucket: "quanta-b4649.firebasestorage.app",
  messagingSenderId: "465668690861",
  appId: "1:465668690861:web:cd42e4fccdc3c6a2da0724",
  measurementId: "G-LWLP6GKTPM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
