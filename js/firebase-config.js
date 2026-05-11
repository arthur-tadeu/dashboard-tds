// Firebase Configuration - TDS25 Dashboard
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, limit } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in your Firebase Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyDKtu5IZgGr7rQ0cCulNSMpRxDheK73XYE",
  authDomain: "dashboard-tds-25.firebaseapp.com",
  projectId: "dashboard-tds-25",
  storageBucket: "dashboard-tds-25.firebasestorage.app",
  messagingSenderId: "919633065833",
  appId: "1:919633065833:web:b6efedd6a3f8a6b8a0eff8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, limit, ref, uploadBytes, getDownloadURL };
