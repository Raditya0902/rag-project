import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, X } from 'lucide-react';

interface QuizSetupProps {
  onSetup: (type: string, topic: string, numQuestions: number, docId: string) => void;
  isLoading: boolean;
  docId: string | null;
  setDocId: (id: string | null) => void;
}

const QUIZ_TYPE_LABELS: Record<string, string> = {
  "open-ended": "Open-ended",
  "mcqs": "MCQs",
  "true-false": "True/False",
};

export default function QuizSetup({ onSetup, isLoading, docId, setDocId }: QuizSetupProps) {
  const [type, setType] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [file, setFile] = useState<File | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (type && numQuestions > 0 && docId) onSetup(type, topic, numQuestions, docId);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:5000"}/upload-pdf`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data.status !== "success") throw new Error(data.error || "Upload failed");

      setDocId(data.doc_id);
      setUploadedName(data.filename ?? file.name);
      setFile(null); // optional: clear selected file after upload
    } catch (e: any) {
      setUploadError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-semibold text-center">Set up your quiz</CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quiz type</Label>
            <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['open-ended', 'mcqs', 'true-false'] as const).map((quizType) => (
                <div key={quizType} className="flex items-center space-x-2">
                  <RadioGroupItem value={quizType} id={quizType} className="peer sr-only" />
                  <Label
                    htmlFor={quizType}
                    className="flex items-center justify-center rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-950/40 px-4 py-3 text-sm font-medium
                      hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition
                      peer-data-[state=checked]:border-zinc-900 peer-data-[state=checked]:bg-zinc-900 peer-data-[state=checked]:text-white
                      dark:peer-data-[state=checked]:border-zinc-100 dark:peer-data-[state=checked]:bg-zinc-100 dark:peer-data-[state=checked]:text-zinc-900"
                  >
                    {QUIZ_TYPE_LABELS[quizType]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">PDF source</Label>

            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-950/40 p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Upload 1 PDF (max 20MB)
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Generate unlimited quizzes from this uploaded document.
                  </p>
                </div>

                <span
                  className={[
                    "text-xs px-2 py-1 rounded-full",
                    docId
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                  ].join(" ")}
                >
                  {docId ? "Ready" : "Not uploaded"}
                </span>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-center md:justify-start gap-2"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {file ? "Change file" : "Choose PDF"}
                  </Button>

                  <div className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                    {file ? (
                      <span className="font-medium">{file.name}</span>
                    ) : uploadedName && docId ? (
                      <>
                        <span className="text-zinc-500 dark:text-zinc-400">Uploaded:</span>{" "}
                        <span className="font-medium">{uploadedName}</span>
                      </>
                    ) : (
                      <span className="text-zinc-500 dark:text-zinc-400">No file selected</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleUpload} disabled={!file || uploading} className="gap-2">
                    {uploading ? "Indexing..." : docId ? "Re-upload & replace" : "Upload & index"}
                  </Button>

                  {docId && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2"
                      onClick={() => {
                        setDocId(null);
                        setUploadedName(null);
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                      Clear PDF
                    </Button>
                  )}
                </div>

                {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium">Quiz topic (optional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Backpropagation basics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num-questions" className="text-sm font-medium">Number of questions</Label>
            <Input
              id="num-questions"
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              min={1}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            disabled={!type || isLoading || !docId}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              'Start Quiz'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
