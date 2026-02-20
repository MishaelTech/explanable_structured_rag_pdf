// import { NextResponse } from "next/server";
// import { storeChunk } from "@/lib/store";
// import { extractText } from "unpdf";

// export async function POST(req: Request) {
//   const formData = await req.formData();
//   const file = formData.get("file") as File;

//   if (!file) {
//     return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//   }

//   const arrayBuffer = await file.arrayBuffer();
//   const buffer = new Uint8Array(arrayBuffer);

//   const { text } = await extractText(buffer, { mergePages: true });

//   const chunks = text.match(/(.|[\r\n]){1,1000}/g) || [];

//   for (const chunk of chunks) {
//     await storeChunk(chunk);
//   }

//   return NextResponse.json({ success: true });
// }

import { NextResponse } from "next/server";
import { storeChunk } from "@/lib/store";
import { extractText } from "unpdf";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const { text } = await extractText(buffer, { mergePages: true });

  // Extract basic metadata from filename
  const filename = file.name.replace(".pdf", "");

  // Chunk the text with overlap for better context
  const chunkSize = 1000;
  const overlap = 200;
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk.length > 50) chunks.push(chunk); // skip tiny chunks
  }

  for (let i = 0; i < chunks.length; i++) {
    await storeChunk(chunks[i], i, {
      paper_title: filename,
    });
  }

  return NextResponse.json({ success: true, chunks: chunks.length });
}
