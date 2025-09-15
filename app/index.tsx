import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    FadeIn,
    SlideInDown,
    SlideInRight,
    SlideInLeft
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getDocs, onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { AIService } from '../services/aiService';

const { width, height } = Dimensions.get('window');

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

    // Subscribe to real-time updates for flashcards
    useEffect(() => {
        loadQuizResults();

        // Initial load
        const loadTotalCards = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'Flashcards-quiz'));
                const flashcardsData = querySnapshot.docs.map((doc) => doc.data());
                setTotalCards(flashcardsData.length);
            } catch (e) {
                console.error('Error loading flashcards:', e);
                setTotalCards(0);
            }
        };

        loadTotalCards();

        // Set up real-time listener
        const flashcardsRef = collection(db, 'Flashcards-quiz');
        const unsubscribe = onSnapshot(flashcardsRef, (snapshot) => {
            const updatedCount = snapshot.docs.length;
            setTotalCards(updatedCount);
            console.log('Updated flashcard count:', updatedCount);
        }, (error) => {
            console.error('Error listening to flashcards updates:', error);
        });

        // Clean up the listener when component unmounts
        return () => unsubscribe();
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
            <Animated.View entering={FadeIn.duration(1000)}>
                <Animated.View
                    style={[styles.header, headerAniamtedStyle]}
                >
                    <LinearGradient
                        colors={['#5b9df9', '#3b82f6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.headerContent}>
                            <Animated.Text
                                style={styles.title}
                                entering={SlideInDown.duration(800).delay(100)}
                            >
                                Flashcard Quiz
                            </Animated.Text>
                            <Animated.Text
                                style={styles.subtitle}
                                entering={SlideInDown.duration(800).delay(200)}
                            >
                                Test your knowledge!
                            </Animated.Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                entering={FadeIn.delay(300)}
            >
                <View style={styles.cardsContainer}>
                    <Animated.View
                        style={[styles.card, styles.statsCard]}
                        entering={SlideInRight.duration(600).delay(200)}
                    >
                        <View style={styles.statItem}>
                            <View style={styles.statIcon}>
                                <FontAwesome5 name="layer-group" size={24} color="#5b9df9" />
                            </View>
                            <View>
                                <Text style={styles.statNumber}>{totalCards}</Text>
                                <Text style={styles.statLabel}>Total Cards</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.statIcon}>
                                <MaterialIcons name="timer" size={24} color="#5b9df9" />
                            </View>
                            <View>
                                <Text style={styles.statNumber}>30s</Text>
                                <Text style={styles.statLabel}>Per Question</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View
                        style={[styles.card, styles.startCard]}
                        entering={SlideInLeft.duration(600).delay(300)}
                    >
                        <View style={styles.startCardContent}>
                            <Text style={styles.startCardTitle}>Ready to Test Yourself?</Text>
                            <Text style={styles.startCardText}>Challenge yourself with our interactive flashcards and improve your knowledge.</Text>
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/quiz');
                                }}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.startButtonText}>Start Quiz</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Always show Recent Activity card */}
                    <Animated.View
                        style={[styles.card, styles.activityCard]}
                        entering={SlideInRight.duration(600).delay(400)}
                    >
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <View style={styles.activityContent}>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreText}>
                                    {quizResults ? Math.round((quizResults.score / totalCards) * 100) : 0}%
                                </Text>
                            </View>
                            <View style={styles.activityDetails}>
                                <Text style={styles.activityText}>
                                    {quizResults ? `You scored ${quizResults.score} out of ${totalCards}` : 'No recent activity yet.'}
                                </Text>
                                <Text style={styles.activityDate}>
                                    {quizResults ? new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    }) : ''}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* AI Generator Card - Add this new section */}
                    <Animated.View
                        style={[styles.card, styles.aiCard]}
                        entering={SlideInLeft.duration(600).delay(500)}
                    >
                        <View style={styles.aiCardContent}>
                            <MaterialIcons name="psychology" size={32} color="#9C27B0" />
                            <Text style={styles.aiCardTitle}>AI Question Generator</Text>
                            <Text style={styles.aiCardText}>
                                Generate new questions using AI based on topics or content
                            </Text>
                            <TouchableOpacity
                                style={styles.aiButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/ai-generator');
                                }}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.aiButtonText}>Generate Questions</Text>
                                <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    header: {
        padding: 30,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#5b9df9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    headerContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        fontFamily: 'System',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 8,
        fontFamily: 'System',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 20,
        paddingBottom: 40,
    },
    cardsContainer: {
        marginTop: -30,
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        backgroundColor: 'rgba(91, 157, 249, 0.15)',
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    startCard: {
        backgroundColor: '#5b9df9',
        padding: 0,
        overflow: 'hidden',
    },
    startCardContent: {
        padding: 24,
        position: 'relative',
        zIndex: 2,
    },
    startCardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    startCardText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 24,
        lineHeight: 22,
    },
    startButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        color: '#5b9df9',
        fontSize: 16,
        fontWeight: '600',
    },
    activityCard: {
        padding: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    activityContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 0,
    },
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        borderWidth: 3,
        borderColor: '#e1f0ff',
    },
    scoreText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#5b9df9',
    },
    activityDetails: {
        flex: 1,
    },
    activityText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
        fontWeight: '500',
    },
    activityDate: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    aiCard: {
        backgroundColor: '#f3e5f5',
        borderWidth: 2,
        borderColor: '#e1bee7',
    },
    aiCardContent: {
        alignItems: 'center',
        padding: 20,
    },
    aiCardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#7b1fa2',
        marginTop: 12,
        marginBottom: 8,
    },
    aiCardText: {
        fontSize: 14,
        color: '#6a1b9a',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    aiButton: {
        backgroundColor: '#9C27B0',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 200,
        shadowColor: '#9C27B0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default WelcomeScreen;