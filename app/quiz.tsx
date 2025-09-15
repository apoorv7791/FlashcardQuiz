import { View, Text, StyleSheet, TouchableOpacity, Animated, Button, ScrollView, TextInput, Alert, Dimensions, Platform } from 'react-native';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQuestions } from '../getQuestions';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedView } from 'react-native-reanimated/lib/typescript/component/View';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768; // Consider 768 as the breakpoint for tablets

const QUESTION_TIME = 10; // seconds per question (single source of truth)

const responsiveFontSize = (size: number) => {
  const scale = Math.min(width / 375, 1.5); // Base width of 375 (iPhone 6/7/8)
  return Math.round(size * scale);
};

const responsivePadding = () => {
  return width * 0.04; // 4% of screen width
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const shuffleflashOptions = (flashcards: Flashcard[]) => {
  return flashcards.map((flashcard) => ({
    ...flashcard,
    options: shuffleArray(flashcard.options),
  }));
};

const saveFlashcards = async (newCards: Flashcard[]) => {
  try {
    await AsyncStorage.setItem('@flashcards_key', JSON.stringify(newCards));
  } catch (e) {
    console.error('Error saving flashcards:', e);
  }
};

const saveQuizResults = async (score: number, total: number) => {
  try {
    const results = {
      score,
      total,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem('@quiz_results', JSON.stringify(results));
  } catch (e) {
    console.error('Error saving quiz results:', e);
  }
};

interface UserAnswer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface Flashcard {
  id?: string;
  question: string;
  options: string[];
  answer: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export default function QuizScreen() {
  const router = useRouter();

  // Quiz state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Debug logs
  useEffect(() => {
    console.log('Current state:', {
      loading,
      flashcardsCount: flashcards.length,
    });
  }, [loading, flashcards]);

  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);

  // Animation state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Timer state
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME);

  // User answers and tracking
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState<string>('');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editAnswer, setEditAnswer] = useState<string>('');

  // Add new question form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newAnswer, setNewAnswer] = useState<string>('');
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Fetch questions using the centralized getQuestions function
  useEffect(() => {
    const fetchAndSetQuestions = async () => {
      setLoading(true);
      try {
        const questions = await getQuestions();
        if (questions.length > 0) {
          const shuffled = shuffleflashOptions(questions);
          setFlashcards(shuffled);
          await saveFlashcards(shuffled);
        } else {
          Alert.alert('No Questions', 'No quiz questions could be loaded. The app will use sample questions.');
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        Alert.alert('Error', 'There was an error loading the quiz. The app will use sample questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetQuestions();
  }, []);

  // Handle quiz completion - use a ref to track if we've already saved results
  const hasSavedResults = useRef(false);

  useEffect(() => {
    if (flashcards.length > 0 && currentQuestion >= flashcards.length && !hasSavedResults.current) {
      hasSavedResults.current = true;
      saveQuizResults(score, flashcards.length);
    }
  }, [currentQuestion, score, flashcards.length]);

  // Memoize the progress animation value
  const progress = useMemo(() => {
    return flashcards.length > 0 ? Math.min((currentQuestion + 1) / flashcards.length, 1) : 0;
  }, [currentQuestion, flashcards.length]);

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Run fade animation each time currentQuestion changes
  useEffect(() => {
    // Reset fade to 0 then animate to 1
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestion, fadeAnim]);

  // Handle moving to the next question
  const handleNextQuestion = useCallback((): void => {
    // note: timer reset is handled by the timer useEffect (which runs on currentQuestion)
    setSelectedOption(null);
    setShowResult(false);
    setCurrentQuestion(prev => prev + 1);
  }, []);

  // Handle question timer
  useEffect(() => {
    if (flashcards.length === 0 || currentQuestion >= flashcards.length) return;

    // reset timer to QUESTION_TIME when a new question mounts
    setQuestionTimeLeft(QUESTION_TIME);
    // Don't start timer if it's paused
    if (isTimerPaused) return;
    const timerId = setInterval(() => {
      setQuestionTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          // Move to next question immediately
          setTimeout(() => {
            handleNextQuestion();
          }, 0);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup function
    return () => clearInterval(timerId);
  }, [currentQuestion, flashcards.length, handleNextQuestion]);


  const handleOptionPress = async (option: string) => {
    // Record the time taken to answer (QUESTION_TIME - remaining seconds)
    setQuestionTimes(prev => [...prev, QUESTION_TIME - questionTimeLeft]);
    setSelectedOption(option);
    setShowResult(true);
    const currentCard = flashcards[currentQuestion];
    const isCorrect = option === currentCard.answer;

    // Fix: do not subtract for wrong answers. +1 for correct, +0 otherwise
    setScore(prev => prev + (isCorrect ? 1 : 0)); // functional update to avoid stale closure

    // Save the user's answer
    const userAnswer: UserAnswer = {
      question: currentCard.question,
      userAnswer: option,
      correctAnswer: currentCard.answer,
      isCorrect,
    };
    setUserAnswers(prev => [...prev, userAnswer]); // functional update

    // if answer is wrong, auto-advance after a short delay
    if (!isCorrect) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      handleNextQuestion();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(null);
      setShowResult(false);
      fadeAnim.setValue(0);
    }
  };

  const startEditing = (index: number) => {
    setEditIndex(index);
    setEditQuestion(flashcards[index].question);
    setEditOptions([...flashcards[index].options]);
    setEditAnswer(flashcards[index].answer);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    // Fix duplicate detection using a Set and trimmings
    const trimmedOptions = editOptions.map(o => o.trim());
    const hasDuplicates = new Set(trimmedOptions).size !== trimmedOptions.length;

    if (
      editIndex === null ||
      !editQuestion.trim() ||
      !trimmedOptions.every((opt) => opt) ||
      !trimmedOptions.includes(editAnswer.trim()) ||
      hasDuplicates
    ) {
      Alert.alert('Error', 'Please fill all fields, ensure the answer matches one option, and avoid duplicate options.');
      return;
    }

    const cardToUpdate = flashcards[editIndex];
    if (!cardToUpdate?.id) {
      Alert.alert('Error', 'Cannot update this flashcard, ID is missing.');
      return;
    }

    const updatedCardData = {
      question: editQuestion,
      options: editOptions,
      answer: editAnswer,
    };

    try {
      // Update Firestore
      const cardRef = doc(db, 'Flashcards-quiz', cardToUpdate.id);
      await updateDoc(cardRef, updatedCardData);

      // Update local state
      setFlashcards(prev => {
        const next = [...prev];
        next[editIndex] = { ...cardToUpdate, ...updatedCardData };
        saveFlashcards(next).catch(console.error);
        return next;
      });

      // Reset editing state
      setIsEditing(false);
      setEditIndex(null);
      setEditQuestion('');
      setEditOptions(['', '', '', '']);
      setEditAnswer('');
      Alert.alert('Success', 'Flashcard updated successfully!');
    } catch (error) {
      console.error("Error updating flashcard: ", error);
      Alert.alert('Error', 'Failed to update flashcard. Please try again.');
    }
  };

  const handleAddFlashcard = async () => {
    // Fix duplicate detection for newOptions using Set + trimming
    const trimmedNewOptions = newOptions.map(o => o.trim());
    const hasDuplicateOptions = new Set(trimmedNewOptions).size !== trimmedNewOptions.length;

    if (
      newQuestion.trim() &&
      trimmedNewOptions.every((opt) => opt) &&
      trimmedNewOptions.includes(newAnswer.trim()) &&
      !hasDuplicateOptions
    ) {
      try {
        const newFlashcard: Omit<Flashcard, 'id'> = {
          question: newQuestion,
          options: newOptions,
          answer: newAnswer,
        };

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'Flashcards-quiz'), newFlashcard);
        console.log('Document written with ID: ', docRef.id);

        // Update local state with the new flashcard (including the ID from Firestore)
        const updatedFlashcard: Flashcard = { ...newFlashcard, id: docRef.id };
        setFlashcards(prev => {
          const updated = shuffleArray([...prev, updatedFlashcard]);
          saveFlashcards(updated).catch(console.error);
          return updated;
        });

        setNewQuestion('');
        setNewOptions(['', '', '', '']);
        setNewAnswer('');
        setShowAddForm(false);

        Alert.alert('Success', 'Flashcard added successfully!');
      } catch (error) {
        console.error('Error adding document: ', error);
        Alert.alert('Error', 'Failed to save flashcard. Please try again.');
      }
    } else {
      const errorMessage = hasDuplicateOptions
        ? 'Options cannot contain duplicates.'
        : 'Please fill all fields and ensure the answer matches one option.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRestart = () => {
    // Shuffle flashcards on restart for a new order
    setFlashcards(prev => shuffleArray(prev));
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setShowResult(false);
    setUserAnswers([]);
    fadeAnim.setValue(0);
    setQuestionTimeLeft(QUESTION_TIME);
    hasSavedResults.current = false;
  };

  // Loading screen
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.text}>Loading Quiz...</Text>
      </View>
    );
  }

  // Results screen when quiz completed
  if (currentQuestion >= flashcards.length) {
    // Ensure results saved at least once
    if (!hasSavedResults.current) {
      hasSavedResults.current = true;
      saveQuizResults(score, flashcards.length).catch(console.error);
    }

    return (
      <View style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }]}>
            {'\n'}
            Quiz Completed!
          </Text>
          <Text style={[styles.scoreText, { fontSize: 20, marginBottom: 20 }]}>
            Final Score: {score} / {flashcards.length}
          </Text>
          <ScrollView style={{ width: '100%', marginBottom: 20 }}>
            {userAnswers.map((answer, idx) => (
              <View key={idx} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Text style={styles.text}>Q: {answer.question}</Text>
                <Text style={styles.text}>
                  Your Answer: {answer.userAnswer} {answer.isCorrect ? '✓' : '✗'}
                </Text>
                {!answer.isCorrect && (
                  <Text style={styles.text}>Correct Answer: {answer.correctAnswer}</Text>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>
              Time per question (example last recorded): {questionTimes.length ? `${questionTimes[questionTimes.length - 1]}s` : `-`}
            </Text>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>
              current Score: {score}
              {score === flashcards.length ? ' You Won! 🎉' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#5b9df9', paddingHorizontal: 20 }]}
            onPress={handleRestart}
          >
            <Text style={styles.nextButtonText}>Restart Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#2196F3', marginTop: 10 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.nextButtonText}>Back to Welcome</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main quiz UI
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => router.back()}>
        <Text style={styles.headerTitle}>Flashcard Quiz</Text>
      </TouchableOpacity>

      {flashcards.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.text}>No questions available.</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.progressBarBg,
              {
                transform: [
                  {
                    scaleX: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.progressBarFill} />
          </Animated.View>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
              {/* Timer Progress Bar */}
              <View style={styles.timerContainer}>
                <Animated.View
                  style={[
                    styles.timerProgress,
                    {
                      width: `${(questionTimeLeft / QUESTION_TIME) * 100}%`,
                      backgroundColor: questionTimeLeft > (QUESTION_TIME * 0.6) ? '#4CAF50' : questionTimeLeft > (QUESTION_TIME * 0.3) ? '#FFC107' : '#F44336'
                    }
                  ]}
                />
              </View>

              <View style={styles.questionHeader}>
                <View style={styles.questionNumberContainer}>
                  <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
                  <Text style={styles.questionCount}>/ {flashcards.length}</Text>
                </View>

                {flashcards[currentQuestion]?.difficulty && (
                  <View style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        flashcards[currentQuestion].difficulty === 'easy' ? '#e8f5e9' :
                          flashcards[currentQuestion].difficulty === 'medium' ? '#fff3e0' : '#ffebee'
                    }
                  ]}>
                    <MaterialIcons
                      name="star"
                      size={16}
                      color={
                        flashcards[currentQuestion].difficulty === 'easy' ? '#2e7d32' :
                          flashcards[currentQuestion].difficulty === 'medium' ? '#ef6c00' : '#c62828'
                      }
                    />
                    <Text style={[
                      styles.difficultyText,
                      {
                        color:
                          flashcards[currentQuestion].difficulty === 'easy' ? '#2e7d32' :
                            flashcards[currentQuestion].difficulty === 'medium' ? '#ef6c00' : '#c62828'
                      }
                    ]}>
                      {flashcards[currentQuestion].difficulty?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {flashcards[currentQuestion]?.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{flashcards[currentQuestion].category}</Text>
                </View>
              )}

              <View style={styles.questionContainer}>
                <View style={styles.questionHeaderRow}>
                  <Text style={styles.question}>
                    {flashcards[currentQuestion].question}
                  </Text>
                  <TouchableOpacity
                    onPress={() => startEditing(currentQuestion)}
                    style={styles.editButton}
                  >
                    <MaterialIcons name="edit" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.timerContainer}>
                <Animated.View
                  style={[
                    styles.timerProgress,
                    {
                      width: `${(questionTimeLeft / QUESTION_TIME) * 100}%`,
                      backgroundColor: questionTimeLeft > (QUESTION_TIME * 0.6) ? '#4CAF50' : questionTimeLeft > (QUESTION_TIME * 0.3) ? '#FFC107' : '#F44336'
                    }
                  ]}
                />
                <TouchableOpacity
                  style={styles.timerControlButton}
                  onPress={() => setIsTimerPaused(!isTimerPaused)}>
                  <MaterialIcons name={isTimerPaused ? "play-arrow" : "pause"} size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Options */}
              {flashcards[currentQuestion].options.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    selectedOption === option && styles.optionSelected,
                    showResult && option === flashcards[currentQuestion].answer && styles.optionCorrect,
                    showResult && selectedOption === option && option !== flashcards[currentQuestion].answer && styles.optionIncorrect
                  ]}
                  onPress={() => handleOptionPress(option)}
                  disabled={showResult}
                >
                  <Text style={styles.optionText}>
                    {String.fromCharCode(65 + idx)}. {option}
                  </Text>
                  {showResult && option === flashcards[currentQuestion].answer && (
                    <MaterialIcons name="check-circle" size={24} color="#4CAF50" style={styles.optionIcon} />
                  )}
                  {showResult && selectedOption === option && option !== flashcards[currentQuestion].answer && (
                    <MaterialIcons name="cancel" size={24} color="#F44336" style={styles.optionIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              title={showAddForm ? 'Hide Add Flashcard' : 'Add Flashcard'}
              onPress={() => setShowAddForm(!showAddForm)}
            />
          </View>

          {showAddForm && (
            <View style={styles.addFlashcardButton}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Add New Flashcard</Text>
              <TextInput
                placeholder="Question"
                value={newQuestion}
                onChangeText={setNewQuestion}
                style={styles.input}
                maxLength={200}
              />
              {newOptions.map((opt, idx) => (
                <TextInput
                  key={idx}
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChangeText={(text) => {
                    const updated = [...newOptions];
                    updated[idx] = text;
                    setNewOptions(updated);
                  }}
                  style={styles.input}
                  maxLength={100}
                />
              ))}
              <TextInput
                placeholder="Correct Answer (must match one option)"
                value={newAnswer}
                onChangeText={setNewAnswer}
                style={styles.input}
                maxLength={100}
              />
              <Button title="Save Flashcard" onPress={handleAddFlashcard} />
              <Button title="Cancel" onPress={() => setShowAddForm(false)} color="#888" />
            </View>
          )}

          {isEditing && (
            <View style={styles.addFlashcardButton}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Edit Flashcard</Text>
              <TextInput
                placeholder="Question"
                value={editQuestion}
                onChangeText={setEditQuestion}
                style={styles.input}
                maxLength={200}
              />
              {editOptions.map((opt, idx) => (
                <TextInput
                  key={idx}
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChangeText={(text) => {
                    const updated = [...editOptions];
                    updated[idx] = text;
                    setEditOptions(updated);
                  }}
                  style={styles.input}
                  maxLength={100}
                />
              ))}
              <TextInput
                placeholder="Correct Answer (must match one option)"
                value={editAnswer}
                onChangeText={setEditAnswer}
                style={styles.input}
                maxLength={100}
              />
              <Button title="Save Changes" onPress={saveEdit} />
              <Button title="Cancel" onPress={() => setIsEditing(false)} color="#888" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: responsivePadding(),
  },
  // timerContainer style removed (duplicate)
  timerControlButton: {
    position: 'absolute',
    right: 0,
    top: -20, // Position above the timer bar
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    paddingVertical: responsiveFontSize(12),
    paddingHorizontal: responsiveFontSize(16),
    marginBottom: responsiveFontSize(16),
    paddingTop: responsiveFontSize(40),
  },
  headerTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: responsiveFontSize(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: responsiveFontSize(6),
    marginBottom: responsiveFontSize(20),
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: responsiveFontSize(16),
    paddingVertical: responsiveFontSize(16),
    paddingHorizontal: responsiveFontSize(24),
    marginVertical: responsiveFontSize(10),
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#5f6caf',
    shadowOffset: { width: 0, height: responsiveFontSize(4) },
    shadowOpacity: 0.10,
    shadowRadius: responsiveFontSize(8),
    elevation: 8,
  },
  optionSelected: {
    backgroundColor: '#3a3a6a',
    borderColor: '#4a4a8a',
  },
  optionCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  optionIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  optionText: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    color: '#333',
  },
  optionIcon: {
    fontSize: responsiveFontSize(20),
    marginLeft: responsiveFontSize(8),
    fontWeight: 'bold',
  },
  questionContainer: {
    width: '100%',
    maxWidth: 600, // Max width for larger screens
    alignSelf: 'center',
    padding: Math.min(width * 0.05, 24),
    backgroundColor: '#fff',
    borderRadius: responsiveFontSize(20),
    shadowColor: '#5f6caf',
    shadowOffset: { width: 0, height: responsiveFontSize(8) },
    shadowOpacity: 0.15,
    shadowRadius: responsiveFontSize(8),
    elevation: 5,
    marginBottom: responsiveFontSize(24),
    borderWidth: 1,
    borderColor: '#ececec',
  },
  timerContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20, // Increased margin to make room for button
    position: 'relative', // Add this
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  questionCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  difficultyBadge: {
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    marginLeft: 5,
  },
  categoryTag: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f7f7f7',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: responsiveFontSize(24),
  },
  question: {
    flex: 1,
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: '#2c3e50',
    lineHeight: responsiveFontSize(32),
    marginRight: responsiveFontSize(16),
  },
  editButton: {
    padding: responsiveFontSize(8),
    borderRadius: responsiveFontSize(8),
    backgroundColor: '#f0f0f0',
  },
  feedbackText: {
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
    marginVertical: responsiveFontSize(20),
    color: '#e67e22',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: responsiveFontSize(16),
    borderRadius: responsiveFontSize(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsiveFontSize(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveFontSize(4),
    elevation: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: responsiveFontSize(12),
    paddingVertical: responsiveFontSize(12),
    paddingHorizontal: responsiveFontSize(28),
    marginHorizontal: responsiveFontSize(8),
    minWidth: width * 0.3, // 30% of screen width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsiveFontSize(2) },
    shadowOpacity: 0.2,
    shadowRadius: responsiveFontSize(4),
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e67e22',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    marginVertical: 4,
  },
  addFlashcardButton: {
    width: '100%',
    maxWidth: 600, // Match question container max width
    alignSelf: 'center',
    padding: responsiveFontSize(16),
    backgroundColor: 'white',
    borderRadius: responsiveFontSize(16),
    marginVertical: responsiveFontSize(10),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsiveFontSize(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveFontSize(4),
    elevation: 3,
  },
  input: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginTop: 10,
  },
  feedbackContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: responsiveFontSize(10),
    marginBottom: responsiveFontSize(10),
  },
  animatedFeedback: {
    width: '100%',
    alignItems: 'center',
  },
});
