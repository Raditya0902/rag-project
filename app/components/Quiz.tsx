'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  Question,
  QuizType,
  MCQQuestion,
  OpenEndedQuestion,
  TrueFalseQuestion,
} from "../../types/quiz";

interface QuizProps {
  questions: Question[];
  type: QuizType;
  onComplete: (answers: string[]) => void;
}

export default function Quiz({ questions, type, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => new Array(questions.length).fill(""));

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const canGoNext = useMemo(() => {
    return (answers[currentIndex] || "").trim().length > 0;
  }, [answers, currentIndex]);

  const setAnswer = (value: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = value;
      return copy;
    });
  };

  const handleNext = () => {
    if (isLast) return onComplete(answers);
    setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));

  if (!questions || questions.length === 0) {
    return <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">No questions returned.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        Question {currentIndex + 1} of {questions.length}
      </div>

      <div className="text-xl font-semibold">{(current as any).question}</div>

      {type === "mcqs" && (
        <MCQView q={current as MCQQuestion} value={answers[currentIndex]} onChange={setAnswer} />
      )}

      {type === "true-false" && (
        <TrueFalseView value={answers[currentIndex]} onChange={setAnswer} />
      )}

      {type === "open-ended" && (
        <OpenEndedView value={answers[currentIndex]} onChange={setAnswer} />
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!canGoNext}>
          {isLast ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function MCQView({
  q,
  value,
  onChange,
}: {
  q: MCQQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {(q.options || []).map((opt, idx) => {
        const selected = value === String(idx);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(String(idx))}
            className={[
              "w-full text-left p-3 rounded-xl border transition",
              selected
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200/70 bg-white/60 hover:bg-white dark:border-zinc-800/70 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/40",
            ].join(" ")}
          >
            <div className="font-medium">
              {String.fromCharCode(65 + idx)}. {opt}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseView({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selectedTrue = value === "true";
  const selectedFalse = value === "false";

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange("true")}
        className={[
          "flex-1 p-3 rounded-xl border transition text-center font-medium",
          selectedTrue
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-200/70 bg-white/60 hover:bg-white dark:border-zinc-800/70 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/40",
        ].join(" ")}
      >
        True
      </button>

      <button
        type="button"
        onClick={() => onChange("false")}
        className={[
          "flex-1 p-3 rounded-xl border transition text-center font-medium",
          selectedFalse
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-200/70 bg-white/60 hover:bg-white dark:border-zinc-800/70 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/40",
        ].join(" ")}
      >
        False
      </button>
    </div>
  );
}

function OpenEndedView({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full p-3 rounded-xl border border-zinc-200/70 bg-white text-zinc-900 placeholder:text-zinc-400
                   focus:outline-none focus:ring-2 focus:ring-zinc-900/20
                   dark:border-zinc-800/70 dark:bg-zinc-950/30 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100/20"
        placeholder="Type your answer..."
      />
      <div className="text-xs text-zinc-600 dark:text-zinc-400">Tip: short answers are fine.</div>
    </div>
  );
}
