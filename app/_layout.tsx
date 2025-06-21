import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Flashcard Quiz"
                }}
            />
            <Stack.Screen
                name="quiz"
                options={{
                    title: "Quiz"
                }}
            />
        </Stack>
    );
}