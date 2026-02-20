import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.HF_API_URL!,
  apiKey: process.env.HF_TOKEN!,
});

export async function streamCompletion(prompt: string) {
  const response = await client.chat.completions.create({
    // model: "meta-llama/Meta-Llama-3-8B-Instruct",
    model: "meta-llama/Llama-3.1-70B-Instruct:scaleway",
    stream: true,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "You are a research assistant. Return ONLY valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  return response;
}
