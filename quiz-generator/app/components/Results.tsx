import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, XCircle } from 'lucide-react';
import type {
  Question,
  QuizType,
  MCQQuestion,
  OpenEndedQuestion,
  TrueFalseQuestion,
} from '../../types/quiz';

interface ResultsProps {
  questions: Question[];
  answers: string[];
  score: number;
  type: QuizType;
  onRestart: () => void;
}

function isCorrect(type: QuizType, q: Question, userAnswer: string): boolean {
  if (!userAnswer) return false;

  if (type === "mcqs") {
    const qq = q as MCQQuestion;
    const chosen = Number(userAnswer);
    return !Number.isNaN(chosen) && chosen === qq.answerIndex;
  }

  if (type === "true-false") {
    const qq = q as TrueFalseQuestion;
    const chosen = userAnswer.toLowerCase() === "true";
    return chosen === qq.answer;
  }

  // open-ended (very loose scoring)
  const qq = q as OpenEndedQuestion;
  const model = (qq.answer || "").toLowerCase();
  const user = (userAnswer || "").toLowerCase();
  return Boolean(user && model && (model.includes(user) || user.includes(model)));
}

function displayUserAnswer(type: QuizType, q: Question, userAnswer: string): string {
  if (!userAnswer) return "(no answer)";

  if (type === "mcqs") {
    const qq = q as MCQQuestion;
    const idx = Number(userAnswer);
    if (Number.isNaN(idx) || !qq.options?.[idx]) return userAnswer;
    return `${String.fromCharCode(65 + idx)}. ${qq.options[idx]}`;
  }

  if (type === "true-false") {
    return userAnswer.toLowerCase() === "true" ? "True" : "False";
  }

  return userAnswer;
}

function displayCorrectAnswer(type: QuizType, q: Question): string {
  if (type === "mcqs") {
    const qq = q as MCQQuestion;
    const idx = qq.answerIndex;
    const text = qq.options?.[idx] ?? "";
    return `${String.fromCharCode(65 + idx)}. ${text}`;
  }

  if (type === "true-false") {
    const qq = q as TrueFalseQuestion;
    return qq.answer ? "True" : "False";
  }

  const qq = q as OpenEndedQuestion;
  return qq.answer;
}

export default function Results({ questions, answers, score, type, onRestart }: ResultsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Quiz Results</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {type !== 'open-ended' && (
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {score} / {questions.length}
            </p>
            <p className="text-xl mt-2">Correct Answers</p>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, index) => {
            const correct = isCorrect(type, q, answers[index] ?? "");

            return (
              <Card
                key={index}
                className={`p-4 rounded-lg border ${
                  type !== "open-ended"
                    ? correct
                      ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                      : "border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >

                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{q.question}</p>
                    {type !== 'open-ended' && (
                      correct
                        ? <CheckCircle className="text-green-600 dark:text-green-400 shrink-0" />
                        : <XCircle className="text-red-600 dark:text-red-400 shrink-0" />
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p>
                      <strong>Your Answer:</strong>{" "}
                      {displayUserAnswer(type, q, answers[index] ?? "")}
                    </p>
                    <p>
                      <strong>Correct Answer:</strong>{" "}
                      {displayCorrectAnswer(type, q)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={onRestart} className="w-full"> Generate Another Quiz (same PDF) </Button>
      </CardFooter>
    </Card>
  );
}
