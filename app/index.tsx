import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Flashcard {
    question: string;
    options: string[];
    answer: string;
}

const WelcomeScreen: React.FC = () => {
    const router = useRouter();
    const [quizResults, setQuizResults] = useState<{
        score: number;
        total: number;
        timestamp: string;
    } | null>(null);
    const [totalCards, setTotalCards] = useState(0);

    const loadQuizResults = async () => {
        try {
            const results = await AsyncStorage.getItem('@quiz_results');
            if (results) {
                setQuizResults(JSON.parse(results));
            }
        } catch (e) {
            console.error('Error loading quiz results:', e);
        }
    };

    const loadTotalCards = async () => {
        try {
            const flashcardsData = await AsyncStorage.getItem('@flashcards_key');
            if (flashcardsData) {
                const flashcards: Flashcard[] = JSON.parse(flashcardsData);
                setTotalCards(flashcards.length);
            } else {
                setTotalCards(12); // Default to initialFlashcards length
            }
        } catch (e) {
            console.error('Error loading flashcards:', e);
            setTotalCards(12);
        }
    };

    useEffect(() => {
        loadQuizResults();
        loadTotalCards();
    }, []);

    const headerOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(30);

    const headerAniamtedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
    }))
    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value, // Reuse the opacity for a fade-in effect
        transform: [{ translateY: buttonTranslateY.value }],
    }));

    useEffect(() => {
        headerOpacity.value = withTiming(1, { duration: 1000, easing: Easing.ease });
        buttonTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.ease });
    })

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.header, { marginTop: 40 }, headerAniamtedStyle]}>
                <LinearGradient
                    colors={["#5b9df9", "#5b9df9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <Text style={styles.title}>Flashcard Quiz</Text>
                    <Text style={styles.subtitle}>Test your knowledge!</Text>
                </LinearGradient>
            </Animated.View>
            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{totalCards}</Text>
                        <Text style={styles.statLabel}>Total Cards</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>20s</Text>
                        <Text style={styles.statLabel}>Time Limit</Text>
                    </View>
                </View>
                <Animated.View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.startButton]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/quiz')
                        }}
                    >
                        <Text style={styles.buttonText}>Start Quiz</Text>
                    </TouchableOpacity>
                </Animated.View>
                <View style={styles.recentActivity}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {quizResults && (
                        <View style={styles.activityItem}>
                            <Text style={styles.activityText}>
                                Last Quiz Score: {quizResults.score}/{totalCards} ✓
                            </Text>
                            <Text style={styles.activityDate}>
                                Completed on : {new Date(quizResults.timestamp).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // A softer, off-white background
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: 'white',
        opacity: 0.9,
        marginTop: 5,
        fontWeight: '400',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 32,
        gap: 16,
    },
    statBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        width: '45%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#5b9df9',
    },
    statLabel: {
        fontSize: 15,
        color: '#666',
        marginTop: 6,
    },
    buttonContainer: {
        gap: 15,
        marginTop: 10,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#5f6caf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    startButton: {
        backgroundColor: '#f67280',
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    recentActivity: {
        marginTop: 30,
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 20,
        shadowColor: '#5f6caf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        borderColor: '#ececec',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    activityItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
    },
    activityText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    activityDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
});

export default WelcomeScreen;