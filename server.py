import json
import chromadb
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_chroma import Chroma
import ollama
import chromadb
from flask import Flask
from flask_cors import CORS
from flask import request, jsonify
import os
import uuid
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def build_json_prompt(kind: str, n_qs: int, query: str, context: str) -> str:
    if kind == "open-ended":
        schema = """Return ONLY valid JSON with this schema:
                    {
                    "type": "open-ended",
                    "questions": [
                        {"question": "...", "answer": "..."}
                    ]
                    }
                 """
    elif kind == "mcqs":
        schema = """
                    Return ONLY valid JSON with this schema:
                    {
                    "type": "mcqs",
                    "questions": [
                        {"question": "...", "options": ["...","...","...","..."], "answerIndex": 0}
                    ]
                    }
                    Rules:
                    - options must be exactly 4 strings
                    - answerIndex must be an integer 0..3
                """
    else:  # true-false
        schema = """
                    Return ONLY valid JSON with this schema:
                    {
                    "type": "true-false",
                    "questions": [
                        {"question": "...", "answer": true}
                    ]
                    }
                    Rules:
                    - answer must be a boolean true/false
                 """

    return f"""
            You are a quiz generator. Use ONLY the provided Context.
            If Context is insufficient, still return valid JSON with "questions": [].
            {schema}
            Make exactly {n_qs} questions if possible.
            Context:
            {context}
            User request:
            {query}""".strip()


def parse_json_safely(text: str):
    text = text.strip()

    # 1) direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) extract first {...} block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end+1])

    raise ValueError("Model did not return valid JSON.")


def getEmbeddings():
    return HuggingFaceBgeEmbeddings(
        model_name="BAAI/bge-small-en",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def setup_chroma():
    # Initialize ChromaDB client
    db=Chroma(persist_directory='database', embedding_function=getEmbeddings())
    
    return db


def query_documents(db, query, n_results=2):
    # Query the collection
    results = db.similarity_search(query, k=n_results)
    
    # Extract and join the retrieved chunks
    context = "\n".join([result.page_content for result in results])
    return context


def generate_prompt(query, context):
    # Create a prompt template that includes context and query
    prompt = f"""You are a chatbot that specializes in computer network, security and communication. Your tone should be professional and informative.
    I am providing you prompt from user who is a professor of university and context. I want you to contruct a quiz from the provided context that contains only 2 open-ended questions.
    question with their answers.

    Context: {context}

    User: {query}
    Chatbot:"""
    return prompt


def get_ollama_response(prompt):
    # Generate response using llama3 through Ollama
    response = ollama.chat(
        model='llama3',
        messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ]
    )
    return response['message']['content']


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def build_collection_from_pdf(doc_id: str, pdf_path: str):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=120)
    chunks = splitter.split_documents(docs)

    # Create/update collection with this doc_id
    Chroma.from_documents(
        documents=chunks,
        embedding=EMBEDDINGS,
        persist_directory="database",
        collection_name=doc_id,
    )
    return len(chunks)


def get_db_for_doc(doc_id: str | None):
    # If doc_id provided, query that collection. Else fall back to default DB
    if doc_id:
        return Chroma(
            persist_directory="database",
            embedding_function=EMBEDDINGS,
            collection_name=doc_id,
        )
    return DB



app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 20 MB limit
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

ALLOWED_EXTENSIONS = {"pdf"}

# --- init once ---
EMBEDDINGS = getEmbeddings()
DB = Chroma(persist_directory="database", embedding_function=EMBEDDINGS)


@app.route('/open-ended', methods=['POST'])
def open_ended():
    try:
        data = request.get_json()
        user_query = data.get('query', '')
        n_qs = int(data.get('qs', 2))

        doc_id = data.get("doc_id")  # <-- new
        db = get_db_for_doc(doc_id)
        context = query_documents(db, user_query, 10)

        prompt = build_json_prompt("open-ended", n_qs, user_query, context)
        raw = get_ollama_response(prompt)

        payload = parse_json_safely(raw)

        return jsonify({
            "status": "success",
            "type": payload.get("type", "open-ended"),
            "questions": payload.get("questions", [])
        })

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route('/mcqs', methods=['POST'])
def mcqs():
    try:
        data = request.get_json()
        user_query = data.get('query', '')
        n_qs = int(data.get('qs', 2))

        doc_id = data.get("doc_id")  # <-- new
        db = get_db_for_doc(doc_id)
        context = query_documents(db, user_query, 10)


        prompt = build_json_prompt("mcqs", n_qs, user_query, context)
        raw = get_ollama_response(prompt)

        payload = parse_json_safely(raw)

        return jsonify({
            "status": "success",
            "type": payload.get("type", "mcqs"),
            "questions": payload.get("questions", [])
        })

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    


@app.route('/true-false', methods=['POST'])
def true_false():
    try:
        data = request.get_json()
        user_query = data.get('query', '')
        n_qs = int(data.get('qs', 2))

        doc_id = data.get("doc_id")  # <-- new
        db = get_db_for_doc(doc_id)
        context = query_documents(db, user_query, 10)

        prompt = build_json_prompt("true-false", n_qs, user_query, context)
        raw = get_ollama_response(prompt)

        payload = parse_json_safely(raw)

        return jsonify({
            "status": "success",
            "type": payload.get("type", "true-false"),
            "questions": payload.get("questions", [])
        })

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "error": "No file part"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"status": "error", "error": "No selected file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"status": "error", "error": "Only PDF files are allowed"}), 400

        doc_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        save_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{filename}")
        file.save(save_path)

        chunk_count = build_collection_from_pdf(doc_id, save_path)

        return jsonify({
            "status": "success",
            "doc_id": doc_id,
            "filename": filename,
            "chunks": chunk_count
        })

    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
