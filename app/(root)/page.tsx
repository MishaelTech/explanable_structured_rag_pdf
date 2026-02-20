// "use client";

// import { useState } from "react";

// export default function Home() {
//   const [question, setQuestion] = useState("");
//   const [result, setResult] = useState<any>(null);
//   const [uploading, setUploading] = useState(false);

//   async function handleFileUpload(file: File) {
//     setUploading(true);

//     const formData = new FormData();
//     formData.append("file", file);

//     await fetch("/api/upload", {
//       method: "POST",
//       body: formData,
//     });

//     setUploading(false);
//     alert("PDF processed successfully");
//   }

//   async function askQuestion() {
//     const res = await fetch("/api/query", {
//       method: "POST",
//       body: JSON.stringify({ question }),
//     });

//     const data = await res.json();
//     setResult(data);
//   }

//   return (
//     <main className="p-10 space-y-6">
//       <h1 className="text-2xl font-bold">AI Research Assistant</h1>

//       <input
//         type="file"
//         title="Upload pdf"
//         accept="application/pdf"
//         onChange={(e) => {
//           const file = e.target.files?.[0];
//           if (file) handleFileUpload(file);
//         }}
//       />

//       {uploading && <p className="text-gray-500">Processing PDF...</p>}

//       <textarea
//         className="border w-full p-2"
//         placeholder="Ask a research question..."
//         value={question}
//         onChange={(e) => setQuestion(e.target.value)}
//       />

//       <Button onClick={askQuestion} className="bg-blue-600 text-white p-2">
//         Ask
//       </Button>

//       {result && (
//         <pre className="bg-gray-100 p-4 mt-4 overflow-x-auto container ">
//           {JSON.stringify(result, null, 2)}
//         </pre>
//       )}
//     </main>
//   );
// }

"use client";

import MetricsTable from "@/components/MetricsTable";
import { Button } from "@/components/ui/button";
import { EvalResult } from "@/types/schema";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<any>(null);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"answer" | "evaluate">("answer");

  async function handleFileUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    alert(`PDF processed: ${data.chunks} chunks stored.`);
  }

  async function askQuestion() {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    setEvalResult(null);

    // Step 1: Run hybrid search first to get chunk IDs automatically
    const evalRes = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send empty relevant_ids — server will auto-derive from hybrid results
      body: JSON.stringify({ query: question, relevant_ids: [] }),
    });
    const evalData: EvalResult = await evalRes.json();
    setEvalResult(evalData);

    // Step 2: Get the LLM answer
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    setActiveTab("answer");
  }

  return (
    <main className="p-10 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center">
        Chinomso Mishael Chukwuma <br /> AI Research Assistant
      </h1>

      {/* Upload */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Upload Research Paper (PDF)</h2>
        <input
          type="file"
          title="Upload Pdf"
          accept="application/pdf"
          className="cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        {uploading && (
          <p className="text-gray-500 text-sm">Processing PDF...</p>
        )}
      </div>

      {/* Query */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Ask a Research Question</h2>
        <textarea
          className="border w-full p-2 rounded"
          rows={3}
          placeholder="e.g. What methods were used for evaluation?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button
          onClick={askQuestion}
          disabled={loading}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </div>

      {/* Tabs */}
      {(result || evalResult) && (
        <div>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setActiveTab("answer")}
              className={`px-4 py-2 rounded-lg cursor-pointer ${
                activeTab === "answer"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-black hover:text-white duration-700 transition-all"
              }`}
            >
              Answer
            </Button>
            <Button
              onClick={() => setActiveTab("evaluate")}
              className={`px-4 py-2 rounded-lg cursor-pointer ${
                activeTab === "evaluate"
                  ? "bg-green-900 text-white"
                  : "bg-gray-100 text-black hover:text-white duration-700 transition-all"
              }`}
            >
              Evaluation
            </Button>
          </div>

          {activeTab === "answer" && result && (
            <div className="bg-gray-50 p-4 rounded border space-y-2">
              <h3 className="font-semibold">Answer</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Title:</span>{" "}
                  {result.paper_title}
                </p>
                <p>
                  <span className="font-medium">Authors:</span>{" "}
                  {result.paper_authours}
                </p>
                <p>
                  <span className="font-medium">Year:</span>{" "}
                  {result.publication_year}
                </p>
                <p>
                  <span className="font-medium">Abstract:</span>{" "}
                  {result.paper_abstract}
                </p>
                <p>
                  <span className="font-medium">Summary:</span>{" "}
                  {result.paper_summary}
                </p>
                {result.paper_url && (
                  <Link
                    href={result.paper_url}
                    className="text-blue-600 underline"
                    target="_blank"
                  >
                    <span className="font-medium">URL:</span> {result.paper_url}
                    {/* </a> */}
                  </Link>
                )}
              </div>
            </div>
          )}

          {activeTab === "evaluate" && evalResult && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Evaluation uses semantic search results as the relevance ground
                truth. Keyword and hybrid methods are scored against it.
              </p>
              <MetricsTable
                metrics={evalResult.results.semantic.metrics}
                label="Semantic Search (Ground Truth)"
                hits={evalResult.results.semantic.hits}
              />
              <MetricsTable
                metrics={evalResult.results.keyword.metrics}
                label="Keyword Search (scored vs semantic)"
                hits={evalResult.results.keyword.hits}
              />
              <MetricsTable
                metrics={evalResult.results.hybrid.metrics}
                label="Hybrid Search (scored vs semantic)"
                hits={evalResult.results.hybrid.hits}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
