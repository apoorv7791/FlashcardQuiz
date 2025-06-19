import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './app/mainScreen/WelcomeScreen';
import Welcome from './app/welcome';
import Home from './app/index'; // Quiz screen
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const WelcomeScreenWrapper = () => {
    const [totalCards, setTotalCards] = useState(0);

    useEffect(() => {
        const fetchTotalCards = async () => {
            try {
                let flashcards = await AsyncStorage.getItem('flashcards');
                let parsedFlashcards = flashcards ? JSON.parse(flashcards) : [];

                if (parsedFlashcards.length === 0) {
                    parsedFlashcards = [
                        {
                            question: "What is the capital of France?",
                            options: "Paris,London,Berlin,Madrid",
                            answer: "Paris"
                        }
                    ];
                    await AsyncStorage.setItem('flashcards', JSON.stringify(parsedFlashcards));
                }

                console.log('Fetched flashcards:', parsedFlashcards);
                setTotalCards(parsedFlashcards.length);
            } catch (error) {
                console.error('Error fetching flashcards:', error);
            }
        };
        fetchTotalCards();
    }, []);

    return <MainScreen totalCards={totalCards} />;
};

export default function App() {
    return (
        <Stack.Navigator initialRouteName="welcomeScreen">
            <Stack.Screen
                name="welcomeScreen"
                component={Welcome}
                options={{ headerShown: true }}
            />
            <Stack.Screen
                name='WelcomeScreen'
                component={WelcomeScreenWrapper}
                options={{ headerShown: true }}
            />
            <Stack.Screen
                name="index"
                component={Home}
                options={{ headerShown: true }}
            />
        </Stack.Navigator>
    );
}