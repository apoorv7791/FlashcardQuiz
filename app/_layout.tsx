import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack initialRouteName="welcome">
            <Stack.Screen
                name="welcome"
                options={{
                    headerShown: true  // Hide header for welcome screen since it has its own header
                }}
            />

            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    title: "FlashCard-Quiz"
                }}
            />
        </Stack>
    );
}