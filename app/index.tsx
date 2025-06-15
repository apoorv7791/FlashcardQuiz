import { View, Text, StyleSheet, TouchableOpacity, Animated, Button, ScrollView, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialFlashcards = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    answer: "Paris"
  },
  {
    question: "What is a linked list?",
    options: [
      "A data structure consisting of nodes, each containing data and a reference to the next node.",
      "A tree with two children per node",
      "A collection of key-value pairs",
      "A FIFO data structure"
    ],
    answer: "A data structure consisting of nodes, each containing data and a reference to the next node."
  },
  {
    question: "What is a stack?",
    options: [
      "A data structure that follows Last-In-First-Out (LIFO) principle.",
      "A data structure that follows First-In-First-Out (FIFO) principle.",
      "A graph",
      "A hash table"
    ],
    answer: "A data structure that follows Last-In-First-Out (LIFO) principle."
  },
  {
    question: "What is a queue?",
    options: [
      "A data structure that follows First-In-First-Out (FIFO) principle.",
      "A data structure that follows Last-In-First-Out (LIFO) principle.",
      "A tree",
      "A linked list"
    ],
    answer: "A data structure that follows First-In-First-Out (FIFO) principle."
  },
  {
    question: "What is a binary search tree?",
    options: [
      "A tree data structure in which each node has at most two children, and left < root < right.",
      "A hash table",
      "A queue",
      "A graph"
    ],
    answer: "A tree data structure in which each node has at most two children, and left < root < right."
  },
  {
    question: "What is a graph?",
    options: [
      "A collection of nodes (vertices) and edges connecting pairs of nodes.",
      "A stack",
      "A queue",
      "A binary tree"
    ],
    answer: "A collection of nodes (vertices) and edges connecting pairs of nodes."
  },
  {
    question: "What is a hash table?",
    options: [
      "A data structure that maps keys to values for highly efficient lookup.",
      "A FIFO data structure",
      "A stack",
      "A tree"
    ],
    answer: "A data structure that maps keys to values for highly efficient lookup."
  },
  {
    question: "What is an element?",
    options: [
      "An element is a basic unit of a data structure.",
      "A queue",
      "An array",
      "A table"
    ],
    answer: "An element is a basic unit of a data structure."
  },
  {
    question: "What are the use cases of the technique BackTracking?",
    options: [
      "Solving puzzles and games (e.g., Sudoku, crossword puzzles).",
      "Generating all possible solutions to a problem (e.g., permutations, combinations).",
      "Finding the optimal solution to a problem (e.g., the traveling salesman problem).",
      "Solving constraint satisfaction problems (e.g., scheduling, resource allocation)."
    ],
    answer: "Solving puzzles and games (e.g., Sudoku, crossword puzzles)."
  },
  {
    question: "What is an Operating System?",
    options: [
      "An operating system is a program that manages computer hardware and software resources, providing common services for computer programs.",
      "A System that is responsible for managing computer hardware and software resources, providing common services for computer programs.",
      "A System that works on the basis of managing computer hardware and software resources, providing common services for computer programs.",
      "An Operating system is an intermidiary between user of a computer and computer hardware."
    ],
    answer: "An operating system is a program that manages computer hardware and software resources, providing common services for computer programs."
  },
  {
    question: "What is nuclear physics?",
    options: [
      "The study of the structure and behavior of the nucleus of an atom.",
      "The study of the behavior of subatomic particles.",
      "The study of the behavior of electrons.",
      "The study of the behavior of protons."
    ],
    answer: "The study of the structure and behavior of the nucleus of an atom."
  },
  {
    question: "What is quantum physics?",
    options: [
      "The study of the behavior of subatomic particles.",
      "The study of the behavior of electrons.",
      "The study of the behavior of protons.",
      "The study of the behavior of electrons and protons."
    ],
    answer: "The study of the behavior of subatomic particles."
  },
];



const saveFlashcards = async (newCards: { question: string; options: string[]; answer: string; }[]) => {
  try {
    const jsonValue = JSON.stringify(newCards);
    await AsyncStorage.setItem('@flashcards_key', jsonValue);
    console.log('Flashcards saved successfully!');
  } catch (e) {
    // saving error
    console.error('Error saving flashcards:', e);
  }
};

const saveQuizResults = async (score: number, total: number) => {
  try {
    const results = {
      score,
      total,
      timestamp: new Date().toISOString()
    };
    await AsyncStorage.setItem('@quiz_results', JSON.stringify(results));
  } catch (e) {
    console.error('Error saving quiz results:', e);
  }
};

function Home() {
  const navigation = useNavigation();
  const [flashcards, setFlashcards] = useState(initialFlashcards);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  // Add Flashcard Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newAnswer, setNewAnswer] = useState('');

  const [userAnswers, setUserAnnswers] = useState<Array<{
    question: String,
    userAnswer: String,
    correctAnswer: string,
    isCorrect: boolean
  }>>([]);

  // Move useEffect outside conditional block
  useEffect(() => {
    if (currentQuestion >= flashcards.length) {
      saveQuizResults(score, flashcards.length);
    }
  }, [currentQuestion, score, flashcards.length]);

  const loadFlashcards = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@flashcards_key');
      if (jsonValue != null) {
        const savedCards = JSON.parse(jsonValue);
        setFlashcards(savedCards);
        console.log('Flashcards loaded successfully!');
      } else {
        setFlashcards(initialFlashcards);
        console.log('No saved flashcards found, using initial set.');
      }
    } catch (e) {
      console.error('Error loading flashcards:', e);
      setFlashcards(initialFlashcards);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestion + 1) / flashcards.length,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [currentQuestion]);

  const handleOptionPress = (option: string) => {
    setSelectedOption(option);
    setShowResult(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    if (option === flashcards[currentQuestion].answer) {
      setScore(score + 1); // 1 point for the correct option 
    } else {
      setScore(score - 1); // i point penalty for wrong answer
    }


    setUserAnnswers([...userAnswers, {
      question: flashcards[currentQuestion].question,
      userAnswer: option,
      correctAnswer: flashcards[currentQuestion].answer,
      isCorrect: option === flashcards[currentQuestion].answer
    }]);
  };

  const handleNext = () => {
    if (currentQuestion < flashcards.length - 1) {  // if current question is not the last question
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowResult(false);
      fadeAnim.setValue(0);
    } else if (currentQuestion === flashcards.length - 1) { // Check if we're on the last question
      setCurrentQuestion(currentQuestion + 1); // Move to the results screen by incrementing currentQuestion beyond the last question
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

  if (currentQuestion >= flashcards.length) {
    const handleRestart = () => {
      setCurrentQuestion(0);
      setScore(0);
      setSelectedOption(null);
      setShowResult(false);
    };

    return (
      <View style={style.container}>
        <Text style={style.text}>You have completed the quiz!</Text>
        <Text style={style.scoreText}>Your score is {score} / {flashcards.length}</Text>
        <View style={style.buttonRow}>
          <Button title="Restart" onPress={handleRestart} />
        </View>
      </View>
    );
  }
  const progress = (currentQuestion + 1) / flashcards.length;
  return (
    <View style={style.container}>
      {/* Progress Bar */}
      <View style={style.progressBarBg}>
        <View style={[style.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      {/* Question and Options */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={style.questionContainer}>
          <Text style={style.question}>{flashcards[currentQuestion].question}</Text>
          {flashcards[currentQuestion].options.map((option, idx) => {
            const isCorrect = showResult && option === flashcards[currentQuestion].answer;
            const isSelected = selectedOption === option;
            return (
              <TouchableOpacity
                key={idx}
                style={[style.optionButton,
                isCorrect ? style.optionCorrect : isSelected && showResult ? style.optionIncorrect : style.optionButton,
                ]}
                activeOpacity={0.8}
                onPress={() => !showResult && handleOptionPress(option)}
                disabled={showResult}
              >
                <Text style={style.optionText}>{option}</Text>
                {showResult && isCorrect && <Text style={style.icon}>✓</Text>}
                {showResult && isSelected && !isCorrect && <Text style={style.icon}>✗</Text>}
              </TouchableOpacity>
            );
          })}
          {showResult && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={style.feedbackText}>
                {selectedOption === flashcards[currentQuestion].answer ? 'Correct!' : 'Wrong!'}
              </Text>
            </Animated.View>
          )}
          {showResult && (
            <View style={style.buttonRow}>
              <TouchableOpacity
                style={[style.nextButton, { backgroundColor: currentQuestion === 0 ? '#cfd8dc' : '#5b9df9' }]}
                onPress={handlePrev}
                disabled={currentQuestion === 0}
              >
                <Text style={style.nextButtonText}>Previous</Text>
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity style={style.nextButton} onPress={handleNext}>
                <Text style={style.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={style.scoreText}>Score: {score}</Text>
        </View>
      </ScrollView>
      <View style={style.buttonContainer}>
        <Button title={showAddForm ? "Hide Add Flashcard" : "Add Flashcard"} onPress={() => setShowAddForm(!showAddForm)} />
      </View>
      {showAddForm && (
        <View style={style.addFlashcardButton}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Add New Flashcard</Text>
          <TextInput
            placeholder="Question"
            value={newQuestion}
            onChangeText={setNewQuestion}
            style={{ marginBottom: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 }}
          />
          {newOptions.map((opt, idx) => (
            <TextInput
              key={idx}
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChangeText={(text: string) => {
                const updated = [...newOptions];
                updated[idx] = text;
                setNewOptions(updated);
              }}
              style={{ marginBottom: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 }}
            />
          ))}
          <TextInput
            placeholder="Correct Answer (must match one of the options)"
            value={newAnswer}
            onChangeText={setNewAnswer}
            style={{ marginBottom: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 }}
          />
          <Button
            title="Save Flashcard"
            onPress={() => {
              if (
                newQuestion.trim() &&
                newOptions.every(opt => opt.trim()) &&
                newOptions.includes(newAnswer)
              ) {
                const newFlashcard = { question: newQuestion, options: newOptions, answer: newAnswer };
                setFlashcards([...flashcards, newFlashcard]);
                setNewQuestion('');
                setNewOptions(['', '', '', '']);
                setNewAnswer('');
                setShowAddForm(false);
                saveFlashcards([...flashcards, newFlashcard]);
              } else {
                alert('Please fill all fields and make sure the answer matches one of the options.');
              }
            }}
          />
          <Button title="Cancel" onPress={() => setShowAddForm(false)} color="#888" />
        </View>
      )}
    </View>
  );

}
export default Home;

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    letterSpacing: 0.5,
  },
  optionButton: {
    width: '100%',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ scale: 1 }],
  },
  optionCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    transform: [{ scale: 1.02 }],
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
    color: 'orange',
    textAlign: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addFlashcardButton: {
    width: '80%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'orange',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    alignContent: 'center',
  },
  addFormContainer: {
    margin: 20,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
