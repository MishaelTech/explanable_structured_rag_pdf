from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field

import os
import tempfile
import uuid
import pandas as pd
import re

def clean_filename(filename):
    # Remove any characters that are not alphanumeric, underscores, or hyphens
    new_filename = re.sub(r'\s\(\d+\)', '', filename)
    return new_filename

def get_pdf_text(uploaded_file):
    try:
        input_file = uploaded_file.read()

        # Create a temporary file to store the uploaded PDF
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.write(input_file)
        temp_file.close()

        # Load the PDF file
        loader = PyPDFLoader(temp_file.name)
        documents = loader.load()
        
        return documents
    finally:
        # Clean up the temporary file
        os.unlink(temp_file.name)

def split_document(documents, chunk_size, chunk_overlap):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, 
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " "]
        )

    return text_splitter.split_document(documents)

def create_embeddings_hf(HF_KEY):
    # Create an instance of the OpenAIEmbeddings class with the Hugging Face API key and the specified model for text embedding

    embedding = OpenAIEmbeddings(
        model="text-embedding-3-small", 
        openai_api_key=HF_KEY)
    
    return embedding

def create_vectorstore_chroma(chunks, embedding, file_name, vector_store_path="db"):
    # Create a list of unique ids for each document based on the content
    ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]

    # Ensure that only unique docs with unique ids are kept
    unique_ids = set()
    unique_chunks = []

    unique_chunks = []
    for chunk, id in zip(chunks, ids):
        if id not in unique_ids:
            unique_ids.add(id)
            unique_chunks.append(chunk)

    # Create a new Chroma database from the documents
    vectorstore = Chroma.from_documents(
        documents=unique_chunks,
        collection_name=clean_filename(file_name),
        ids=list(unique_ids),
        embedding=embedding,
        persist_directory = vector_store_path
        )

    vectorstore.persist()

    return vectorstore

def create_vectorstore_from_text(documents, HF_KEY, file_name):
    # Split the document into smaller chunks
    doc = split_document(documents, chunk_size=1000, chunk_overlap=200)

    # Create an instance of the OpenAIEmbeddings class with the Hugging Face API key and the specified model for text embedding
    embedding = create_embeddings_hf(HF_KEY)

    # Create a new Chroma database from the documents
    vectorstore = create_vectorstore_chroma(doc, embedding, file_name)

    return vectorstore

def load_vectorstore(file_name, HF_KEY, vector_store_path="db"):

    embedding = create_embeddings_hf(HF_KEY)
    return Chroma(
        persist_directory=vector_store_path, 
        embedding_function=embedding, 
        collection_name=clean_filename(file_name)
        )
