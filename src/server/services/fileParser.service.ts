import mammoth from "mammoth";

// Dynamic import or require for pdf-parse to avoid ESM/CJS discrepancies
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule: any = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(buffer);
    return data?.text || "";
  } catch (err) {
    console.error("[FILE PARSE] PDF parsing error:", err);
    // Fallback extraction from raw strings if binary parsing fails
    const rawStr = buffer.toString("utf-8");
    const cleanMatches = rawStr.match(/[A-Za-z0-9\s.,;:'"()\-–—/@]{4,}/g);
    return cleanMatches ? cleanMatches.join(" ").substring(0, 15000) : "Failed to extract clean text from PDF binary.";
  }
}

async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err) {
    console.error("[FILE PARSE] DOCX parsing error:", err);
    throw new Error("Unable to parse DOCX document structure.");
  }
}

export interface ExtractedDocument {
  text: string;
  wordCount: number;
  charCount: number;
  mimeType: string;
}

export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedDocument> {
  let extractedText = "";

  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    extractedText = await parsePdfBuffer(buffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    fileName.toLowerCase().endsWith(".docx") ||
    fileName.toLowerCase().endsWith(".doc")
  ) {
    extractedText = await parseDocxBuffer(buffer);
  } else {
    // Treat as plain text
    extractedText = buffer.toString("utf-8");
  }

  // Clean and sanitize extracted text
  const sanitized = extractedText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .replace(/\s+/g, " ")
    .trim();

  const words = sanitized.length > 0 ? sanitized.split(/\s+/).length : 0;

  return {
    text: sanitized.substring(0, 50000), // Cap extracted text to 50k characters for safe AI context windows
    wordCount: words,
    charCount: sanitized.length,
    mimeType
  };
}
