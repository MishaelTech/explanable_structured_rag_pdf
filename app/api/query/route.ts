// import { NextResponse } from "next/server";
// import { searchSimilar } from "@/lib/search";
// import { generateWithRetry } from "@/lib/generate";

// export async function POST(req: Request) {
//   const { question } = await req.json();

//   const context = await searchSimilar(question);

//   const prompt = `
// Use the context below to extract research information.

// ${context}

// Question: ${question}
// `;

//   const result = await generateWithRetry(prompt);

//   return NextResponse.json(result);
// }

import { NextResponse } from "next/server";
import { searchSimilar } from "@/lib/search";
import { generateWithRetry } from "@/lib/generate";

export async function POST(req: Request) {
  const { question } = await req.json();

  const context = await searchSimilar(question);

  const prompt = `
You are a research assistant. Use the context below to answer the question.
You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no extra text.

The JSON must have exactly these fields:
{
  "paper_title": "title of the paper",
  "paper_abstract": "abstract or summary of the paper",
  "paper_url": "URL of the paper if available, otherwise empty string",
  "paper_summary": "your summary of the relevant findings",
  "paper_authours": "authors of the paper if available, otherwise empty string",
  "publication_year": "year of publication if available, otherwise empty string"
}

Context:
${context}

Question: ${question}

Respond with ONLY the JSON object, nothing else.
`;

  const result = await generateWithRetry(prompt);

  return NextResponse.json(result);
}
