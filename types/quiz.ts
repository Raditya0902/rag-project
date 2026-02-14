export type QuizType = "open-ended" | "mcqs" | "true-false";

export type OpenEndedQuestion = {
  question: string;
  answer: string;
};

export type MCQQuestion = {
  question: string;
  options: string[];      // exactly 4 strings
  answerIndex: number;    // 0..3
};

export type TrueFalseQuestion = {
  question: string;
  answer: boolean;
};

export type Question = OpenEndedQuestion | MCQQuestion | TrueFalseQuestion;

export interface QuizState {
  stage: "setup" | "quiz" | "results";
  type: QuizType;
  topic: string;

  questions: Question[];
  answers: string[];
  score: number;
  error: string | null;
}
