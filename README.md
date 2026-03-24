# DocQuiz: RAG-Based Quiz Generator from PDFs

DocQuiz generates quizzes directly from uploaded PDF documents.

It combines:
- Retrieval-Augmented Generation (RAG) for document-grounded context
- Local vector search with Chroma
- Local LLM inference with Ollama (`llama3`)
- A Flask API backend and Next.js frontend

## Problem Statement

Teachers and students often have long study material (slides, notes, books) but limited time to create practice questions manually.

DocQuiz solves this by:
- ingesting a PDF,
- indexing it as embeddings,
- retrieving relevant chunks for a query/topic,
- generating structured quiz questions in JSON format.

Supported quiz types:
- Open-ended
- Multiple-choice (MCQs)
- True/False

## Core Concept (How It Works)

1. **Upload PDF**
   - Endpoint: `POST /upload-pdf`
   - File is stored in `uploads/`
   - PDF text is loaded and chunked
   - Chunks are embedded with `BAAI/bge-small-en`
   - Stored in Chroma under a unique `doc_id` collection

2. **Retrieve Context**
   - For quiz requests (`/open-ended`, `/mcqs`, `/true-false`), backend runs similarity search on that `doc_id` collection.
   - Top chunks are joined as context.

3. **Generate Quiz**
   - Backend builds a strict JSON prompt.
   - Calls Ollama (`llama3`) with context + user query.
   - Parses model output into valid JSON response.

4. **Render in UI**
   - Frontend (`quiz-generator/`) uploads PDF, stores `doc_id`, requests quiz questions, and renders quiz flow + results.

## Project Structure

| Path | Purpose |
|------|---------|
| `server.py` | Flask backend API, retrieval, prompt construction, quiz generation |
| `vectorization.py` | Optional one-time script to pre-index sample PDFs from `data/` |
| `quiz-generator/` | Next.js frontend (App Router) |
| `database/` | Local Chroma storage (gitignored runtime data) |
| `uploads/` | Uploaded PDFs (gitignored runtime data) |
| `data/` | Sample local PDFs for experimentation |

## Tech Stack

- Python + Flask
- LangChain + Chroma
- HuggingFace BGE embeddings (`BAAI/bge-small-en`)
- Ollama (`llama3`)
- Next.js 15 + React + Tailwind CSS

## Prerequisites

- Python 3.11+ (3.13 also works in this setup)
- Node.js 18+
- Ollama installed and running locally
- Ollama model pulled:

```bash
ollama pull llama3
```

## Reproduce the Project (End-to-End)

### 1) Clone and setup backend

```bash
git clone https://github.com/Raditya0902/rag-project.git
cd rag-project

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Start backend

```bash
python server.py
```

Backend runs at: `http://127.0.0.1:5000`

### 3) Setup and start frontend

Open a second terminal:

```bash
cd quiz-generator
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 4) Use the app

1. Open `http://localhost:3000`
2. Upload a PDF
3. Choose quiz type and number of questions
4. Start quiz

## API Reproduction via cURL (without UI)

### Upload PDF

```bash
curl -s -F "file=@/absolute/path/to/your.pdf" http://127.0.0.1:5000/upload-pdf
```

Important: `@` must be present in curl form upload.

### Generate MCQs

```bash
curl -s -X POST http://127.0.0.1:5000/mcqs \
  -H "Content-Type: application/json" \
  -d '{"query":"neural networks","qs":3,"doc_id":"<DOC_ID_FROM_UPLOAD>"}'
```

## Optional: Pre-index Sample PDFs

```bash
python vectorization.py
```

This indexes files from `data/` into default Chroma storage.  
Primary flow remains: upload with `/upload-pdf` and use returned `doc_id`.

## Notes and Good Practices

- `database/` and `uploads/` are runtime artifacts and should not be committed.
- `quiz-generator/.next` and `quiz-generator/node_modules` are build/dependency outputs and are gitignored.
- Use only PDFs you are authorized to use/distribute.
