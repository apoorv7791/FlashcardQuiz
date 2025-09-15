import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AIService, GenerateQuestionsRequest } from '../services/aiService';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Flashcard } from '../types';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AIGeneratorScreen() {
    const router = useRouter();
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [count, setCount] = useState('5');
    const [content, setContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

    const handleGenerateQuestions = async () => {
        if (!topic.trim()) {
            Alert.alert('Error', 'Please enter a topic');
            return;
        }

        setIsGenerating(true);
        try {
            const request: GenerateQuestionsRequest = {
                topic: topic.trim(),
                difficulty,
                count: parseInt(count) || 5,
            };

            const questions = await AIService.generateQuestions(request);
            setGeneratedQuestions(questions);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate questions. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateFromContent = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter some content');
            return;
        }

        setIsGenerating(true);
        try {
            const questions = await AIService.generateFromContent({
                content: content.trim(),
                count: parseInt(count) || 3,
            });
            setGeneratedQuestions(questions);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate questions from content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveQuestionToFirebase = async (question: any) => {
        try {
            const flashcard: Omit<Flashcard, 'id'> = {
                question: question.question,
                options: question.options,
                answer: question.answer,
            };

            await addDoc(collection(db, 'Flashcards-quiz'), flashcard);
            Alert.alert('Success', 'Question saved to your quiz!');
        } catch (error) {
            Alert.alert('Error', 'Failed to save question');
        }
    };

    const saveAllQuestions = async () => {
        try {
            for (const question of generatedQuestions) {
                const flashcard: Omit<Flashcard, 'id'> = {
                    question: question.question,
                    options: question.options,
                    answer: question.answer,
                };
                await addDoc(collection(db, 'Flashcards-quiz'), flashcard);
            }
            Alert.alert('Success', `All ${generatedQuestions.length} questions saved!`);
            setGeneratedQuestions([]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save some questions');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Question Generator</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Topic-based Generation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Generate by Topic</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter topic (e.g., React Native, JavaScript, CSS)"
                        value={topic}
                        onChangeText={setTopic}
                        multiline
                    />

                    <View style={styles.row}>
                        <Text style={styles.label}>Difficulty:</Text>
                        <View style={styles.difficultyButtons}>
                            {(['easy', 'medium', 'hard'] as const).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.difficultyButton,
                                        difficulty === level && styles.difficultyButtonActive,
                                    ]}
                                    onPress={() => setDifficulty(level)}
                                >
                                    <Text style={[
                                        styles.difficultyButtonText,
                                        difficulty === level && styles.difficultyButtonTextActive,
                                    ]}>
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Number of questions:</Text>
                        <TextInput
                            style={styles.numberInput}
                            value={count}
                            onChangeText={setCount}
                            keyboardType="numeric"
                            maxLength={2}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                        onPress={handleGenerateQuestions}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.generateButtonText}>Generate Questions</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Content-based Generation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Generate from Content</Text>

                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Paste your content here (articles, notes, etc.)"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        numberOfLines={6}
                    />

                    <TouchableOpacity
                        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                        onPress={handleGenerateFromContent}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.generateButtonText}>Generate from Content</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Generated Questions */}
                {generatedQuestions.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.sectionTitle}>
                                Generated Questions ({generatedQuestions.length})
                            </Text>
                            <TouchableOpacity style={styles.saveAllButton} onPress={saveAllQuestions}>
                                <Text style={styles.saveAllButtonText}>Save All</Text>
                            </TouchableOpacity>
                        </View>

                        {generatedQuestions.map((question, index) => (
                            <View key={index} style={styles.questionCard}>
                                <Text style={styles.questionText}>{question.question}</Text>

                                {question.options.map((option: string, optionIndex: number) => (
                                    <View key={optionIndex} style={styles.optionContainer}>
                                        <Text style={styles.optionText}>
                                            {String.fromCharCode(65 + optionIndex)}. {option}
                                        </Text>
                                        {option === question.answer && (
                                            <Text style={styles.correctIndicator}>✓</Text>
                                        )}
                                    </View>
                                ))}

                                {question.explanation && (
                                    <Text style={styles.explanationText}>
                                        <Text style={styles.explanationLabel}>Explanation: </Text>
                                        {question.explanation}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => saveQuestionToFirebase(question)}
                                >
                                    <Text style={styles.saveButtonText}>Save to Quiz</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#5b9df9',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginRight: 10,
        minWidth: 120,
    },
    difficultyButtons: {
        flexDirection: 'row',
        flex: 1,
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginHorizontal: 2,
        borderRadius: 6,
        alignItems: 'center',
    },
    difficultyButtonActive: {
        backgroundColor: '#5b9df9',
        borderColor: '#5b9df9',
    },
    difficultyButtonText: {
        color: '#666',
        fontSize: 14,
    },
    difficultyButtonTextActive: {
        color: '#fff',
    },
    numberInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
        width: 60,
        textAlign: 'center',
        fontSize: 16,
    },
    generateButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    generateButtonDisabled: {
        backgroundColor: '#ccc',
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    saveAllButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    saveAllButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    questionCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#5b9df9',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        color: '#555',
    },
    correctIndicator: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 16,
    },
    explanationText: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
        fontStyle: 'italic',
    },
    explanationLabel: {
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
