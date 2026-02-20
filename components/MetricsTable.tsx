import { Hit, Metrics } from "@/types/schema";

const MetricsTable = ({
  metrics,
  label,
  hits,
}: {
  metrics: Metrics;
  label: string;
  hits: Hit[];
}) => (
  <div className="mb-6">
    <h4 className="font-semibold text-sm mb-2">{label}</h4>
    <table className="text-sm border w-full mb-3">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border">Precision</th>
          <th className="p-2 border">Recall</th>
          <th className="p-2 border">F1</th>
          <th className="p-2 border">nDCG</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="p-2 border text-center">{metrics.precision}</td>
          <td className="p-2 border text-center">{metrics.recall}</td>
          <td className="p-2 border text-center">{metrics.f1}</td>
          <td className="p-2 border text-center">{metrics.ndcg}</td>
        </tr>
      </tbody>
    </table>
    <div className="space-y-2">
      {hits.map((hit, i) => (
        <div key={hit.id} className="border p-3 rounded text-sm bg-gray-50">
          <div className="flex justify-between">
            <span className="font-medium">
              #{i + 1} {hit.paper_title || "Untitled"}
            </span>
            <span className="text-gray-500 text-xs">
              Combined: {Number(hit.combined_score).toFixed(4)} | Semantic:{" "}
              {Number(hit.semantic_score).toFixed(4)} | Keyword:{" "}
              {Number(hit.keyword_score).toFixed(4)}
            </span>
          </div>
          <p className="mt-1 text-gray-700">{hit.text.slice(0, 200)}...</p>
        </div>
      ))}
    </div>
  </div>
);

export default MetricsTable;
