import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import Home from './quiz';

interface Flashcard {
    question: string;
    options: string[];
    answer: string;
}

export default function RootLayout() {
    const [totalCards, setTotalCards] = useState(0);

    useEffect(() => {
        const loadFlashcards = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('@flashcards_key');
                if (jsonValue) {
                    const savedCards: Flashcard[] = JSON.parse(jsonValue);
                    setTotalCards(savedCards.length);
                } else {
                    setTotalCards(12); // Default to initialFlashcards length
                }
            } catch (e) {
                console.error('Error loading flashcards:', e);
            }
        };
        loadFlashcards();
    }, []);

    return (
        <Stack
            initialRouteName="welcome"
            screenOptions={{
                headerShown: true,
            }}
        >
            <Stack.Screen
                name="welcome"
                initialParams={{ totalCards }}
            />
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: "FlashCard-Quiz"
                }}
            />
        </Stack>
    );
}