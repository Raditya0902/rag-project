import warnings
warnings.filterwarnings("ignore")

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

def get_embeddings():
    model_name = "BAAI/bge-small-en"
    model_kwargs = {"device": "cpu"}
    encode_kwargs = {"normalize_embeddings": True}
    return HuggingFaceBgeEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs,
    )


files = [
    DATA_DIR / "07-0 Neural Network.pdf",
    DATA_DIR / "07-1 back-propoagation.pdf",
]

docs = []
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)

for path in files:
    loader = PyPDFLoader(str(path))
    loaded = loader.load()
    docs.extend(splitter.split_documents(loaded))

persist_directory = "database"

vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=get_embeddings(),
    persist_directory=persist_directory,
)

print(f"✅ Vector DB created at: {persist_directory} with {len(docs)} chunks")
