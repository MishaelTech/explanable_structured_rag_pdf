import { z } from "zod";

export const ResearchSchema = z.object({
  paper_title: z.string(),
  paper_abstract: z.string(),
  paper_url: z.string(),
  paper_summary: z.string(),
  paper_authours: z.string(),
  publication_year: z.string(),
});

export interface ChunkMetadata {
  paper_title?: string;
  paper_authors?: string;
  publication_year?: string;
  paper_url?: string;
  paper_abstract?: string;
}

export interface SearchResult {
  id: string;
  text: string;
  paper_title: string;
  paper_authors: string;
  publication_year: string;
  paper_url: string;
  paper_abstract: string;
  semantic_score: number;
  keyword_score: number;
  combined_score: number;
}

export interface Hit {
  id: string;
  text: string;
  paper_title: string;
  combined_score: number;
  semantic_score: number;
  keyword_score: number;
}

export interface Metrics {
  precision: number;
  recall: number;
  f1: number;
  ndcg: number;
}

export interface EvalResult {
  query: string;
  results: {
    semantic: { hits: Hit[]; metrics: Metrics };
    keyword: { hits: Hit[]; metrics: Metrics };
    hybrid: { hits: Hit[]; metrics: Metrics };
  };
}
