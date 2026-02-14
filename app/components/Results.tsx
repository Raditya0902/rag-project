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
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-semibold text-center">Results</CardTitle>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {type !== 'open-ended' && (
          <div className="text-center">
            <p className="text-4xl font-semibold">
              {score} <span className="text-zinc-500">/ {questions.length}</span>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Correct answers</p>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, index) => {
            const correct = isCorrect(type, q, answers[index] ?? "");

            return (
              <div
                key={index}
                className={[
                  "rounded-2xl border p-4",
                  "border-zinc-200/60 bg-white/60 dark:border-zinc-800/60 dark:bg-zinc-950/30",
                  type !== "open-ended"
                    ? (correct
                      ? "ring-1 ring-emerald-500/20"
                      : "ring-1 ring-red-500/20")
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{(q as any).question}</p>

                  {type !== 'open-ended' && (
                    correct
                      ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                      : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="text-zinc-500">Your answer:</span>{" "}
                    <span className="font-medium">{displayUserAnswer(type, q, answers[index] ?? "")}</span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Correct answer:</span>{" "}
                    <span className="font-medium">{displayCorrectAnswer(type, q)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="px-0">
        <Button onClick={onRestart} className="w-full">
          Take another quiz
        </Button>
      </CardFooter>
    </Card>
  );
}
