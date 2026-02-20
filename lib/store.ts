// import { pool } from "./db";
// import { getEmbedding } from "./embedding";
// import { v4 as uuid4 } from "uuid";

// export async function storeChunk(text: string) {
//   const embedding = await getEmbedding(text);
//   const embeddingStr = `[${embedding.join(",")}]`;

//   await pool.query(
//     "INSERT INTO chunks (id, text, embedding) VALUES ($1, $2, $3::vector)",
//     [uuid4(), text, embeddingStr],
//   );
// }

import { ChunkMetadata } from "@/types/schema";
import { pool } from "./db";
import { getEmbedding } from "./embedding";
import { v4 as uuid4 } from "uuid";

export async function storeChunk(
  text: string,
  chunkIndex: number,
  metadata: ChunkMetadata = {},
) {
  const embedding = await getEmbedding(text);
  const embeddingStr = `[${embedding.join(",")}]`;

  await pool.query(
    `INSERT INTO chunks 
      (id, text, chunk_index, chunk_length, embedding, paper_title, paper_authors, publication_year, paper_url, paper_abstract)
     VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $8, $9, $10)`,
    [
      uuid4(),
      text,
      chunkIndex,
      text.length,
      embeddingStr,
      metadata.paper_title ?? null,
      metadata.paper_authors ?? null,
      metadata.publication_year ?? null,
      metadata.paper_url ?? null,
      metadata.paper_abstract ?? null,
    ],
  );
}
