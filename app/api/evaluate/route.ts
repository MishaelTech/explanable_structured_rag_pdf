import { NextResponse } from "next/server";
import { semanticSearch, keywordSearch, hybridSearch } from "@/lib/search";

function computeMetrics(
  results: { id: string }[],
  relevantIds: string[],
): {
  precision: number;
  recall: number;
  f1: number;
  ndcg: number;
} {
  const retrievedIds = results.map((r) => r.id);
  const k = retrievedIds.length;

  const truePositives = retrievedIds.filter((id) =>
    relevantIds.includes(id),
  ).length;
  const precision = k > 0 ? truePositives / k : 0;
  const recall =
    relevantIds.length > 0 ? truePositives / relevantIds.length : 0;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  let dcg = 0;
  for (let i = 0; i < retrievedIds.length; i++) {
    const isRelevant = relevantIds.includes(retrievedIds[i]) ? 1 : 0;
    dcg += isRelevant / Math.log2(i + 2);
  }

  let idcg = 0;
  for (let i = 0; i < Math.min(relevantIds.length, k); i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  const ndcg = idcg > 0 ? dcg / idcg : 0;

  return {
    precision: parseFloat(precision.toFixed(4)),
    recall: parseFloat(recall.toFixed(4)),
    f1: parseFloat(f1.toFixed(4)),
    ndcg: parseFloat(ndcg.toFixed(4)),
  };
}

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const [semanticResults, keywordResults, hybridResults] = await Promise.all([
    semanticSearch(query, 5),
    keywordSearch(query, 5),
    hybridSearch(query, 5),
  ]);

  // Use semantic results as ground truth (most reliable since keyword is broken)
  // This gives a meaningful comparison between methods
  const relevantIds = semanticResults.map((r) => r.id);

  return NextResponse.json({
    query,
    relevantIds,
    results: {
      semantic: {
        hits: semanticResults,
        // Will score 1,1,1,1 — this is the baseline/ground truth
        metrics: computeMetrics(semanticResults, relevantIds),
      },
      keyword: {
        hits: keywordResults,
        // How many keyword results overlap with semantic ground truth
        metrics: computeMetrics(keywordResults, relevantIds),
      },
      hybrid: {
        hits: hybridResults,
        // How many hybrid results overlap with semantic ground truth
        metrics: computeMetrics(hybridResults, relevantIds),
      },
    },
  });
}
