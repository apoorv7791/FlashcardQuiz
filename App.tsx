
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from './app/welcome';
import Home from './app/index'; // Quiz screen

const Stack = createNativeStackNavigator();


export default function App() {
    return (
        <Stack.Navigator initialRouteName="welcomeScreen">
            <Stack.Screen
                name="welcomeScreen"
                component={Welcome}
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