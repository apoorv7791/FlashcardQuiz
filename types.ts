
export interface Flashcard {
  id?: string;
  question: string;
  options: string[];
  answer: string;
}

export interface GenerateQuestionsRequest {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  existingQuestions?: string[];
}

export interface GenerateFromContentRequest {
  content: string;
  count?: number;
}

export interface AIQuestion extends Flashcard {
  explanation?: string;
  difficulty?: string;
  category?: string;
}