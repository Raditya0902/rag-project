'use client';

import { useState } from 'react';
import QuizSetup from './components/QuizSetup';
import Quiz from './components/Quiz';
import Results from './components/Results';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import type { QuizState, QuizType, Question, MCQQuestion, OpenEndedQuestion, TrueFalseQuestion } from '../types/quiz';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:5000";

function endpointFor(type: QuizType) {
  switch (type) {
    case "open-ended": return "/open-ended";
    case "mcqs": return "/mcqs";
    case "true-false": return "/true-false";
    default: return "/open-ended";
  }
}

function scoreQuiz(type: QuizType, questions: Question[], answers: string[]) {
  let score = 0;

  if (type === "mcqs") {
    const qs = questions as MCQQuestion[];
    for (let i = 0; i < qs.length; i++) {
      const a = answers[i];
      if (!a) continue;
      const chosen = Number(a);
      if (!Number.isNaN(chosen) && chosen === qs[i].answerIndex) score++;
    }
    return score;
  }

  if (type === "true-false") {
    const qs = questions as TrueFalseQuestion[];
    for (let i = 0; i < qs.length; i++) {
      const a = answers[i];
      if (!a) continue;
      const chosen = a.toLowerCase() === "true";
      if (chosen === qs[i].answer) score++;
    }
    return score;
  }

  // open-ended (loose scoring)
  const qs = questions as OpenEndedQuestion[];
  for (let i = 0; i < qs.length; i++) {
    const model = (qs[i].answer || "").toLowerCase();
    const user = (answers[i] || "").toLowerCase();
    if (user && model && (model.includes(user) || user.includes(model))) score++;
  }
  return score;
}

export default function Home() {
  const [docId, setDocId] = useState<string | null>(null);

  const [quizState, setQuizState] = useState<QuizState>({
    stage: 'setup',
    type: "open-ended",
    topic: '',
    questions: [],
    answers: [],
    score: 0,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleQuizSetup = async (type: string, topic: string, numQuestions: number, docIdArg: string) => {
    const normalizedType = (type === "mcq" ? "mcqs" : type) as QuizType;

    setIsLoading(true);
    setQuizState((prev) => ({
      ...prev,
      stage: "quiz",
      type: normalizedType,
      topic,
      error: null,
      questions: [],
      answers: [],
      score: 0,
    }));

    try {
      const endpoint = endpointFor(normalizedType);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: topic, qs: numQuestions, doc_id: docIdArg }),
      });

      const data = await response.json();

      if (data.status !== "success") throw new Error(data.error || "Failed to fetch questions");

      const questions: Question[] = Array.isArray(data.questions) ? data.questions : [];
      const answers = new Array(questions.length).fill("");

      setQuizState((prev) => ({ ...prev, questions, answers }));
    } catch (e) {
      console.error(e);
      setQuizState((prev) => ({ ...prev, error: "An error occurred. Please try again." }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (answers: string[]) => {
    const score = scoreQuiz(quizState.type, quizState.questions, answers);
    setQuizState((prev) => ({ ...prev, stage: 'results', answers, score }));
  };

  // IMPORTANT: keep docId so user can take another quiz from same PDF
  const handleRestart = () => {
    setQuizState((prev) => ({
      ...prev,
      stage: 'setup',
      topic: '',
      questions: [],
      answers: [],
      score: 0,
      error: null,
    }));
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center rounded-full border border-zinc-200/60 bg-white/70 px-3 py-1 text-xs text-zinc-600 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950/40 dark:text-zinc-300">
            AI-powered PDF Quiz Generator
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            DocQuiz
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Upload once. Generate unlimited quizzes from your document.
          </p>
        </div>

        <Card className="border-zinc-200/60 bg-white/70 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/40">
          <CardContent className="p-6 md:p-8">
            {quizState.stage === 'setup' && (
              <QuizSetup
                onSetup={handleQuizSetup}
                isLoading={isLoading}
                docId={docId}
                setDocId={setDocId}
              />
            )}

            {quizState.stage === 'quiz' && (
              isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Generating questions…
                  </p>
                </div>
              ) : quizState.error ? (
                <div className="text-center space-y-3 py-10">
                  <p className="text-sm text-red-500">{quizState.error}</p>
                  <Button onClick={handleRestart} variant="outline">
                    Back
                  </Button>
                </div>
              ) : (
                <Quiz
                  questions={quizState.questions}
                  type={quizState.type}
                  onComplete={handleQuizComplete}
                />
              )
            )}

            {quizState.stage === 'results' && (
              <Results
                questions={quizState.questions}
                answers={quizState.answers}
                score={quizState.score}
                type={quizState.type}
                onRestart={handleRestart}
              />
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Powered by Chroma + BGE embeddings + Ollama
        </p>
      </div>
    </main>
  );
}
