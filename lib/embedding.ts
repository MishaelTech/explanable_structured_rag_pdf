// import OpenAI from "openai";

// const client = new OpenAI({
//   baseURL: process.env.HF_API_URL!,
//   apiKey: process.env.HF_TOKEN!,
// });

// export async function getEmbedding(text: string): Promise<number[]> {
//   const response = await client.embeddings.create({
//     model: "text-embedding-3-small",
//     input: text,
//   });
//   return response.data[0].embedding;
// }

import { HfInference, InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN!);

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  // featureExtraction returns a nested array, flatten to 1D
  const embedding = Array.isArray(response[0])
    ? (response as number[][])[0]
    : (response as number[]);

  return embedding;
}
