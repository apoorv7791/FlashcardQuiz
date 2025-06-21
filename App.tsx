
import { Stack } from 'expo-router';

export default function App() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: "Flashcard Quiz",
                    headerShown: true
                }}
            />
            <Stack.Screen
                name="quiz"
                options={{
                    title: "Quiz",
                    headerShown: true
                }}
            />
        </Stack>
    );
}