// // import { pool } from "./db";
// // import { getEmbedding } from "./embedding";

// // export async function searchSimilar(query: string) {
// //   const queryEmbedding = await getEmbedding(query);

// //   const result = await pool.query(
// //     `
// //     SELECT text
// //     FROM chunks
// //     ORDER BY embedding <-> $1
// //     LIMIT 5
// //     `,
// //     [queryEmbedding],
// //   );

// //   return result.rows.map((row) => row.content).join("\n\n");
// // }

// import { pool } from "./db";
// import { getEmbedding } from "./embedding";

// export async function searchSimilar(query: string) {
//   const queryEmbedding = await getEmbedding(query);
//   const embeddingStr = `[${queryEmbedding.join(",")}]`;

//   const result = await pool.query(
//     `
//     SELECT text
//     FROM chunks
//     ORDER BY embedding <-> $1::vector
//     LIMIT 5
//     `,
//     [embeddingStr],
//   );

//   return result.rows.map((row) => row.text).join("\n\n");
// }

import { SearchResult } from "@/types/schema";
import { pool } from "./db";
import { getEmbedding } from "./embedding";

// Semantic search using cosine similarity
export async function semanticSearch(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query);
  const embeddingStr = `[${embedding.join(",")}]`;

  const result = await pool.query(
    `SELECT 
        id, text, paper_title, paper_authors, publication_year, paper_url, paper_abstract,
        1 - (embedding <=> $1::vector) AS semantic_score,
        0 AS keyword_score,
        1 - (embedding <=> $1::vector) AS combined_score
     FROM chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [embeddingStr, limit],
  );
  return result.rows;
}

// Full-text keyword search — more flexible query parsing
export async function keywordSearch(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  // Extract meaningful words, strip stop words manually
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3) // drop short/stop words
    .slice(0, 10); // cap at 10 terms

  if (words.length === 0) {
    return [];
  }

  // Build an OR query so partial matches still return results
  const tsQuery = words.map((w) => `${w}:*`).join(" | ");

  const result = await pool.query(
    `SELECT 
        id, text, paper_title, paper_authors, publication_year, paper_url, paper_abstract,
        0 AS semantic_score,
        ts_rank_cd(tsvector_text, to_tsquery('english', $1)) AS keyword_score,
        ts_rank_cd(tsvector_text, to_tsquery('english', $1)) AS combined_score
     FROM chunks
     WHERE tsvector_text @@ to_tsquery('english', $1)
     ORDER BY keyword_score DESC
     LIMIT $2`,
    [tsQuery, limit],
  );
  return result.rows;
}

// Hybrid search: combines semantic + keyword scores with boosting
export async function hybridSearch(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query);
  const embeddingStr = `[${embedding.join(",")}]`;

  // Weights: 70% semantic, 30% keyword
  const semanticWeight = 0.7;
  const keywordWeight = 0.3;

  const result = await pool.query(
    `SELECT 
        id, text, paper_title, paper_authors, publication_year, paper_url, paper_abstract,
        1 - (embedding <=> $1::vector) AS semantic_score,
        COALESCE(ts_rank_cd(tsvector_text, plainto_tsquery('english', $2)), 0) AS keyword_score,
        -- Combined boosted score
        (
          $3 * (1 - (embedding <=> $1::vector)) +
          $4 * COALESCE(ts_rank_cd(tsvector_text, plainto_tsquery('english', $2)), 0) +
          -- Boost chunks that match in title
          CASE WHEN paper_title ILIKE '%' || $2 || '%' THEN 0.1 ELSE 0 END
        ) AS combined_score
     FROM chunks
     ORDER BY combined_score DESC
     LIMIT $5`,
    [embeddingStr, query, semanticWeight, keywordWeight, limit],
  );
  return result.rows;
}

// Main search function used by the query API
export async function searchSimilar(query: string): Promise<string> {
  const results = await hybridSearch(query, 5);
  return results.map((r) => r.text).join("\n\n");
}
