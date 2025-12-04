export enum QuestionType {
  MULTIPLE_CHOICE = 'Trắc nghiệm nhiều lựa chọn',
  TRUE_FALSE = 'Trắc nghiệm đúng sai',
  SHORT_ANSWER = 'Trả lời ngắn',
  ESSAY = 'Tự luận'
}

export enum DifficultyLevel {
  EASY = 'Nhận biết',
  MEDIUM = 'Thông hiểu',
  HARD = 'Vận dụng',
  EXPERT = 'Vận dụng cao'
}

export interface SubQuestion {
  id: string; // a, b, c, d
  content: string;
  isCorrect: boolean; // True/False result
  explanation?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string; // Markdown/LaTeX content
  
  // For Multiple Choice
  options?: string[]; 
  
  // For True/False
  subQuestions?: SubQuestion[];

  // For Short Answer, Essay, and MC
  correctAnswer?: string; 
  
  points: number;
}

export interface Topic {
  id: string;
  name: string;
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export type ExamMode = 'file' | 'curriculum';

export interface ExamConfig {
  mode: ExamMode;
  numMC: number; // Part 1: Multiple Choice
  numTF: number; // Part 2: True/False
  numShort: number; // Part 3: Short Answer
  numEssay: number; // Part 4: Essay
  difficulty: DifficultyLevel;
  
  // File Mode
  uploadedFileBase64?: string | null;
  uploadedFileMimeType?: string | null;

  // Curriculum Mode
  selectedChapters: string[]; // List of Chapter IDs
  selectedTopics: string[]; // List of Topic IDs
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}