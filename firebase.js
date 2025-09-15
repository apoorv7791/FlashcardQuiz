// firebase.js
import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2X2X2X2X2X2X2X2X2X2X2X2X2X2X2X2",
  authDomain: "flashcard-quiz-2c5b6.firebaseapp.com",
  projectId: "flashcard-quiz-50bdd",
  storageBucket: "flashcard-quiz-50bdd.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to handle connection issues
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: false, // Set to true if you're having connection issues
    useFetchStreams: true,
  });
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Fallback to default initialization if there's an error
  db = getFirestore(app);
}

export { db };
