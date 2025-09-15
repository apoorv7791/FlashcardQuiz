import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Flashcard } from './types';

// Sample questions to use as fallback
const sampleQuestions: Flashcard[] = [
  {
    id: '1',
    question: 'What is React Native?',
    options: [
      'A framework for building native apps using React',
      'A programming language',
      'A database management system',
      'A design pattern'
    ],
    answer: 'A framework for building native apps using React'
  },
  {
    id: '2',
    question: 'What is JSX?',
    options: [
      'A syntax extension for JavaScript',
      'A new programming language',
      'A CSS preprocessor',
      'A build tool'
    ],
    answer: 'A syntax extension for JavaScript'
  }
];

export async function getQuestions(): Promise<Flashcard[]> {
  try {
    console.log('Fetching questions from Firestore...');
    const querySnapshot = await getDocs(collection(db, "Flashcards-quiz"));
    console.log(`Found ${querySnapshot.docs.length} documents in collection`);

    const questions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Processing document ${doc.id}:`, data);
      return {
        id: doc.id,
        question: data.question || '',
        options: Array.isArray(data.options) ? data.options : [],
        answer: data.answer || ''
      };
    });

    // Filter out invalid questions
    const validQuestions = questions.filter(question =>
      question.question &&
      Array.isArray(question.options) &&
      question.options.length > 0 &&
      question.answer &&
      question.options.includes(question.answer)
    );

    console.log(`Found ${validQuestions.length} valid questions`);

    // Return valid questions if we have any, otherwise fall back to sample questions
    return validQuestions.length > 0 ? validQuestions : sampleQuestions;

  } catch (error) {
    console.error('Error fetching questions from Firestore:', error);
    console.log('Falling back to sample questions');
    return sampleQuestions;
  }
}
