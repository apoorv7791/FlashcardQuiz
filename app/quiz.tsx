import { View, Text, StyleSheet, TouchableOpacity, Animated, Button, ScrollView, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Flashcard {
  question: string;
  options: string[];
  answer: string;
}

const initialFlashcards: Flashcard[] = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    answer: "Paris",
  },
  {
    question: "What is a linked list?",
    options: [
      "A data structure consisting of nodes, each containing data and a reference to the next node.",
      "A tree with two children per node",
      "A collection of key-value pairs",
      "A FIFO data structure",
    ],
    answer: "A data structure consisting of nodes, each containing data and a reference to the next node.",
  },
  {
    question: "What is a stack?",
    options: [
      "A data structure that follows Last-In-First-Out (LIFO) principle.",
      "A data structure that follows First-In-First-Out (FIFO) principle.",
      "A graph",
      "A hash table",
    ],
    answer: "A data structure that follows Last-In-First-Out (LIFO) principle.",
  },
  {
    question: "What is a queue?",
    options: [
      "A data structure that follows First-In-First-Out (FIFO) principle.",
      "A data structure that follows Last-In-First-Out (LIFO) principle.",
      "A tree",
      "A linked list",
    ],
    answer: "A data structure that follows First-In-First-Out (FIFO) principle.",
  },
  {
    question: "What is a binary search tree?",
    options: [
      "A tree data structure in which each node has at most two children, and left < root < right.",
      "A hash table",
      "A queue",
      "A graph",
    ],
    answer: "A tree data structure in which each node has at most two children, and left < root < right.",
  },
  {
    question: "What is a graph?",
    options: [
      "A collection of nodes (vertices) and edges connecting pairs of nodes.",
      "A stack",
      "A queue",
      "A binary tree",
    ],
    answer: "A collection of nodes (vertices) and edges connecting pairs of nodes.",
  },
  {
    question: "What is a hash table?",
    options: [
      "A data structure that maps keys to values for highly efficient lookup.",
      "A FIFO data structure",
      "A stack",
      "A tree",
    ],
    answer: "A data structure that maps keys to values for highly efficient lookup.",
  },
  {
    question: "What is an element?",
    options: [
      "An element is a basic unit of a data structure.",
      "A queue",
      "An array",
      "A table",
    ],
    answer: "An element is a basic unit of a data structure.",
  },
  {
    question: "What are the use cases of the technique BackTracking?",
    options: [
      "Solving puzzles and games (e.g., Sudoku, crossword puzzles).",
      "Generating all possible solutions to a problem (e.g., permutations, combinations).",
      "Undoing previous choices when a solution path fails (e.g., recursive backtracking in mazes).",
      "Exploring all configurations in constraint satisfaction problems (e.g., scheduling, resource allocation).",
    ],
    answer: "Solving puzzles and games (e.g., Sudoku, crossword puzzles).",
  },
  {
    question: "What is an Operating System?",
    options: [
      "An operating system is a program that manages computer hardware and software resources, providing common services for computer programs.",
      "A System that is responsible for managing computer hardware and software resources, providing common services for computer programs.",
      "A System that works on the basis of managing computer hardware and software resources, providing common services for computer programs.",
      "An Operating system is an intermediary between user of a computer and computer hardware.",
    ],
    answer: "An operating system is a program that manages computer hardware and software resources, providing common services for computer programs.",
  },
  {
    question: "What is nuclear physics?",
    options: [
      "The study of the structure and behavior of the nucleus of an atom.",
      "The study of the behavior of subatomic particles.",
      "The study of the behavior of electrons.",
      "The study of the behavior of protons.",
    ],
    answer: "The study of the structure and behavior of the nucleus of an atom.",
  },
  {
    question: "What is quantum physics?",
    options: [
      "The study of the behavior of subatomic particles.",
      "The study of the behavior of electrons.",
      "The study of the behavior of protons.",
      "The study of the behavior of electrons and protons.",
    ],
    answer: "The study of the behavior of subatomic particles.",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;

}

const saveFlashcards = async (newCards: Flashcard[]) => {
  try {
    console.log('Saving flashcards:', newCards);
    await AsyncStorage.setItem('@flashcards_key', JSON.stringify(newCards));
    console.log('Flashcards saved successfully!');
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

export default function Home() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editAnswer, setEditAnswer] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newAnswer, setNewAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<
    Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>
  >([]);

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@flashcards_key');
        if (jsonValue) {
          const savedCards: Flashcard[] = JSON.parse(jsonValue);
          console.log('Loaded flashcards from storage:', savedCards);
          setFlashcards(savedCards);
        } else {
          console.log('No saved flashcards found, using initial set.');
          const shuffled = shuffleArray(initialFlashcards);
          setFlashcards(shuffled);
          saveFlashcards(shuffled);
        }
      } catch (e) {
        console.error('Error loading flashcards:', e);
        setFlashcards(initialFlashcards);
      }
    };
    loadFlashcards();
  }, []);

  useEffect(() => {
    if (currentQuestion >= flashcards.length) {
      saveQuizResults(score, flashcards.length);
    }
  }, [currentQuestion, score, flashcards.length]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestion + 1) / flashcards.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestion, flashcards.length]);

  const handleOptionPress = (option: string) => {
    setSelectedOption(option);
    setShowResult(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    const isCorrect = option === flashcards[currentQuestion].answer;
    setScore(score + (isCorrect ? 1 : -1)); // +1 for correct -1 for wrong option
    setUserAnswers([
      ...userAnswers,
      {
        question: flashcards[currentQuestion].question,
        userAnswer: option,
        correctAnswer: flashcards[currentQuestion].answer,
        isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    if (currentQuestion < flashcards.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowResult(false);
      fadeAnim.setValue(0);
    } else {
      setCurrentQuestion(currentQuestion + 1);
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

  const saveEdit = () => {
    if (
      editQuestion.trim() &&
      editOptions.every((opt) => opt.trim()) &&
      editOptions.includes(editAnswer) &&
      !editOptions.some((opt, i) => editOptions.indexOf(opt) !== i && opt.trim())
    ) {
      const updated = [...flashcards];
      updated[editIndex!] = {
        question: editQuestion,
        options: editOptions,
        answer: editAnswer,
      };
      setFlashcards(updated);
      saveFlashcards(updated);
      setIsEditing(false);
      setEditIndex(null);
      setEditQuestion('');
      setEditOptions(['', '', '', '']);
      setEditAnswer('');
    } else {
      alert('Please fill all fields, ensure the answer matches one option, and avoid duplicate options.');
    }
  };

  const handleAddFlashcard = () => {
    const hasDuplicateOptions = newOptions.some(
      (opt, index) => newOptions.indexOf(opt) !== index && opt.trim()
    );
    if (
      newQuestion.trim() &&
      newOptions.every((opt) => opt.trim()) &&
      newOptions.includes(newAnswer) &&
      !hasDuplicateOptions
    ) {
      const newFlashcard: Flashcard = {
        question: newQuestion,
        options: newOptions,
        answer: newAnswer,
      };
      const updatedFlashcards = [...flashcards, newFlashcard];
      setFlashcards(updatedFlashcards);
      saveFlashcards(updatedFlashcards);
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setNewAnswer('');
      setShowAddForm(false);
    } else {
      const errorMessage = hasDuplicateOptions
        ? 'Options cannot contain duplicates.'
        : 'Please fill all fields and ensure the answer matches one option.';
      alert(errorMessage);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setShowResult(false);
    setUserAnswers([]);
    fadeAnim.setValue(0);
  };

  if (currentQuestion >= flashcards.length) {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => router.back()}>
        <Text style={styles.headerTitle}>Flashcard Quiz</Text>
      </TouchableOpacity>
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
        <View style={styles.questionContainer}>
          <Text style={styles.question}>
            {currentQuestion + 1}. {flashcards[currentQuestion].question}
          </Text>
          <TouchableOpacity
            onPress={() => startEditing(currentQuestion)}
            style={{ alignSelf: 'flex-start', marginVertical: 8 }}
          >
            <Text style={{ color: '#5b9df9', fontWeight: 'bold', fontSize: 16 }}>Edit</Text>
          </TouchableOpacity>
          {flashcards[currentQuestion].options.map((option, idx) => {
            const isCorrect = showResult && option === flashcards[currentQuestion].answer;
            const isSelected = selectedOption === option;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  isCorrect ? styles.optionCorrect : isSelected && showResult ? styles.optionIncorrect : null,
                ]}
                activeOpacity={0.8}
                onPress={() => !showResult && handleOptionPress(option)}
                disabled={showResult}
              >
                <Text style={styles.optionText}>{option}</Text>
                {showResult && isCorrect && <Text style={styles.icon}>✓</Text>}
                {showResult && isSelected && !isCorrect && <Text style={styles.icon}>✗</Text>}
              </TouchableOpacity>
            );
          })}
          {showResult && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.feedbackText}>
                {selectedOption === flashcards[currentQuestion].answer ? 'Correct!' : 'Wrong!'}
              </Text>
            </Animated.View>
          )}
          {showResult && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: currentQuestion === 0 ? '#cfd8dc' : '#5b9df9' }]}
                onPress={handlePrev}
                disabled={currentQuestion === 0}
              >
                <Text style={styles.nextButtonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestion === flashcards.length - 1 ? 'Finish' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  questionContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 24,
    lineHeight: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 16,
    color: '#333',
  },
  icon: {
    fontSize: 20,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 20,
    color: '#e67e22',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
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
    marginVertical: 4,
  },
  addFlashcardButton: {
    width: '100%',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});
