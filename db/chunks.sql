CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  -- Document-level fields
  paper_title TEXT,
  paper_authors TEXT,
  publication_year TEXT,
  paper_url TEXT,
  paper_abstract TEXT,
  -- Chunk-level fields
  text TEXT NOT NULL,
  chunk_index INTEGER,           -- position of chunk in document
  chunk_length INTEGER,          -- character length of chunk
  -- Search & ranking fields
  embedding vector(384),         -- semantic embedding
  tsvector_text TSVECTOR,        -- full-text search index
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vector similarity search (cosine distance)
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for full-text search
CREATE INDEX ON chunks USING GIN (tsvector_text);

-- Auto-update tsvector when text changes
CREATE OR REPLACE FUNCTION update_tsvector() RETURNS trigger AS $$
BEGIN
  NEW.tsvector_text := to_tsvector('english',
    COALESCE(NEW.paper_title, '') || ' ' ||
    COALESCE(NEW.paper_authors, '') || ' ' ||
    COALESCE(NEW.paper_abstract, '') || ' ' ||
    COALESCE(NEW.text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update
BEFORE INSERT OR UPDATE ON chunks
FOR EACH ROW EXECUTE FUNCTION update_tsvector();
