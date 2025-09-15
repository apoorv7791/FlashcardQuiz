import { db } from "./firebase";
import { getDocs, collection } from "firebase/firestore";

export async function getQuestions() {
    try {
        const querySnapshot = await getDocs(collection(db, "Flashcards-quiz"));
        const questions = querySnapshot.docs.map(doc => doc.data());
        return questions;
    } catch (error) {
        console.error("Error fetching questions from Firebase:", error);
        return [];
    }
}