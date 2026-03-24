# DocQuiz — RAG PDF quiz generator

Upload a PDF, index it into **Chroma** with **BGE** embeddings, then generate **open-ended**, **multiple-choice**, or **true/false** quizzes using **Ollama** (default: `llama3`). A **Next.js** UI in `quiz-generator/` talks to a **Flask** API.

## Architecture

| Part | Role |
|------|------|
| `server.py` | Flask app on `http://127.0.0.1:5000`: `/upload-pdf`, `/open-ended`, `/mcqs`, `/true-false`. |
| `quiz-generator/` | Next.js 15 frontend (`npm run dev` → usually `http://localhost:3000`). |
| `vectorization.py` | Optional one-off script: index PDFs under `data/` into Chroma (`database/`). |
| `database/` | Chroma persistence (local, should not be committed; see below). |
| `uploads/` | Saved uploads from the API (local, should not be committed). |

## Prerequisites

- **Python** 3.11+ (3.13 ok if your stack supports it)
- **Ollama** with a chat model, e.g. `ollama pull llama3`
- **Node.js** 18+ for the frontend

## Backend

```bash
cd /path/to/LLM_quiz_bot
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# If embedding/CPU setup fails, follow PyTorch install instructions for your platform.

python server.py
```

API runs with `debug=True` on port **5000** by default.

### Quick API test

```bash
curl -s -F "file=@data/07-0 Neural Network.pdf" http://127.0.0.1:5000/upload-pdf
# Use returned doc_id:
curl -s -X POST http://127.0.0.1:5000/mcqs \
  -H "Content-Type: application/json" \
  -d '{"query":"neural networks","qs":3,"doc_id":"<DOC_ID>"}'
```

Use `@/path/to/file.pdf` with curl so the file is actually attached (the `@` matters).

## Frontend

```bash
cd quiz-generator
npm install
npm run dev
```

Keep `server.py` running; the UI calls `http://127.0.0.1:5000`.

## Optional: seed index from `data/`

```bash
python vectorization.py
```

This uses fixed filenames under `data/` and a different chunk size than `/upload-pdf`. Normal use is **upload via UI or `/upload-pdf`** so each document gets its own Chroma collection (`doc_id`).

---

## GitHub / repository hygiene (important)

If this repo was pushed as-is, it may have **serious problems**:

1. **`quiz-generator/node_modules/`** — tens of thousands of files should **never** be committed. Clone size and PRs become unusable.
2. **`quiz-generator/.next/`** — build output; should be ignored (your index may have these **staged**).
3. **`database/`** — local Chroma DB; large and regeneratable.
4. **`uploads/`** — user uploads may include **personal or copyrighted PDFs**; they should not be public on GitHub.
5. **No root `.gitignore`** — fixed in this tree by adding `.gitignore`; ensure it is committed.
6. **`quiz-generator/.git`** — a **nested** Git repo inside `quiz-generator/` splits history from the parent. For one repo on GitHub, remove the inner `.git` (after backing up) and treat `quiz-generator` as a normal folder, or convert to a proper **submodule**.
7. **Branch divergence** — if `main` and `origin/main` both moved, reconcile with merge/rebase before pushing.

### Stop tracking junk (keep files on disk)

From the repo root:

```bash
git rm -r --cached quiz-generator/node_modules quiz-generator/.next database uploads 2>/dev/null || true
git rm --cached quiz-generator/.DS_Store 2>/dev/null || true
git add .gitignore
git commit -m "Stop tracking build artifacts, node_modules, local DB, and uploads"
```

If `node_modules` or large PDFs were **already pushed**, shrinking the remote needs history rewrite (e.g. `git filter-repo`) or a fresh repo — coordinate with anyone who cloned.

---

## License / content

Only upload PDFs you have the **right** to use and distribute. Sample lecture PDFs in `data/` are for local development; add them to `.gitignore` if you cannot redistribute them.
