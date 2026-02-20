// import { ResearchSchema } from "@/types/schema";
// import { streamCompletion } from "./llm";

// export async function generateWithRetry(
//   prompt: string,
//   maxRetries: number = 3,
// ) {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       const stream = await streamCompletion(prompt);

//       let fullText = "";
//       for await (const chunk of stream) {
//         fullText += chunk.choices[0]?.delta?.content || "";
//       }

//       try {
//         const parsed = JSON.parse(fullText);
//         return ResearchSchema.parse(parsed);
//       } catch (error) {
//         console.error("Failed to parse JSON:", error);
//         console.log("Retrying due to invalid Json");
//       }
//     } catch (error) {
//       console.error("Error during generation:", error);
//     }
//   }
//   throw new Error(
//     "Model failed to generate valid JSON after multiple attempts.",
//   );
// }

import { ResearchSchema } from "@/types/schema";
import { streamCompletion } from "./llm";

export async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const stream = await streamCompletion(prompt);

      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.choices[0]?.delta?.content || "";
      }

      try {
        // Strip markdown code fences if the model wraps JSON in ```json ... ```
        const cleaned = fullText
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();

        const parsed = JSON.parse(cleaned);
        return ResearchSchema.parse(parsed);
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        console.log("Raw response was:", fullText);
        console.log("Retrying due to invalid JSON");
      }
    } catch (error) {
      console.error("Error during generation:", error);
    }
  }
  throw new Error(
    "Model failed to generate valid JSON after multiple attempts.",
  );
}
