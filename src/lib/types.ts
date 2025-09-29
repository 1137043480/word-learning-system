export interface WordCharacter {
  character: string;
  pinyin: string;
  definition: string;
  audio: string;
}

export interface WordCollocation {
  collocation: string;
  translation: string;
  audio: string;
}

export interface WordExample {
  sentence: string;
  pinyin: string;
  translation: string;
  audio: string;
}

export interface WordResponse {
  id: number;
  pinyin: string;
  definition: string;
  examples: WordExample[];
  collocations: WordCollocation[];
  characters: WordCharacter[];
}

export interface WordSummary {
  id: number;
  pinyin: string;
  definition: string;
}

export type ExerciseQuestionType = 'definition' | 'collocation' | 'fill_word';

export interface ExerciseQuestionPayload {
  id: string;
  type: ExerciseQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  feedback?: string;
}

export interface ExerciseSetResponse {
  wordId: number;
  word: string;
  definition: string;
  options: string[];
  questionCount: number;
  questions: ExerciseQuestionPayload[];
}
