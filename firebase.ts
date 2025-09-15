// firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore,
  FirestoreSettings
} from "firebase/firestore";

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
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore with settings to handle connection issues
let db: Firestore;
try {
  const settings: FirestoreSettings = {
    experimentalForceLongPolling: false, // Set to true if you're having connection issues
    experimentalAutoDetectLongPolling: true, // Better handling for connection issues
  };
  db = initializeFirestore(app, settings);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Fallback to default initialization if there's an error
  db = getFirestore(app);
}

export { db, app };

export interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
