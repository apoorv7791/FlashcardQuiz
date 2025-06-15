import WelcomeScreen from './mainScreen/WelcomeScreen';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuizResults {
    score: number;
    total: number;
    timestamp: string;
}

export default function Welcome() {
    const [totalCards, setTotalCards] = useState(0);
    const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load flashcards
                const jsonValue = await AsyncStorage.getItem('@flashcards_key');
                if (jsonValue != null) {
                    const savedCards = JSON.parse(jsonValue);
                    setTotalCards(savedCards.length);
                } else {
                    // Use initial flashcards length if no saved cards
                    setTotalCards(12); // This is the length of initialFlashcards
                }

                // Load quiz results
                const resultsJson = await AsyncStorage.getItem('@quiz_results');
                if (resultsJson != null) {
                    const results = JSON.parse(resultsJson);
                    setQuizResults(results);
                }
            } catch (e) {
                console.error('Error loading data:', e);
                setTotalCards(12); // Fallback to initial length
            }
        };

        loadData();
    }, []);

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'just now';
        if (diffInHours === 1) return '1 hour ago';
        return `${diffInHours} hours ago`;
    };

    return <WelcomeScreen
        totalCards={totalCards}
        lastScore={quizResults ? `${quizResults.score}/${quizResults.total}` : '8/12'}
        lastScoreTime={quizResults ? formatTimeAgo(quizResults.timestamp) : '2 hours ago'}
    />;
} 