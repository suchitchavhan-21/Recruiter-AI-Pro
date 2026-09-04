import mammoth from "mammoth";

// Dynamic import or require for pdf-parse to avoid ESM/CJS discrepancies
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule: any = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(buffer);
    const text = (data?.text || "").trim();
    if (!text) {
      throw new Error("EMPTY_TEXT: PDF parsed successfully but contains no selectable text layer (e.g. scanned image).");
    }
    return text;
  } catch (err: any) {
    console.error("[FILE PARSE] PDF parsing error:", err?.message || err);
    throw new Error(`PARSING_FAILED: Malformed or unreadable PDF document (${err?.message || "unrecognized structure"}).`);
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
  if (!buffer || buffer.length === 0) {
    throw new Error("EMPTY_FILE: Document file contains zero bytes.");
  }

  // Reject legacy binary .doc format explicitly
  if (fileName.toLowerCase().endsWith(".doc") && !fileName.toLowerCase().endsWith(".docx")) {
    throw new Error("UNSUPPORTED_FORMAT: Legacy binary Microsoft Word (.doc) format is not supported. Please convert and upload a modern .docx or .pdf file.");
  }

  // Security Check: Reject binary executables (Windows PE / ELF / Mach-O / Scripts)
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) { // 'MZ'
    throw new Error("MALICIOUS_FILE: Executable binary files are strictly prohibited.");
  }
  if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) { // 'ELF'
    throw new Error("MALICIOUS_FILE: Executable binary files are strictly prohibited.");
  }

  let extractedText = "";

  const isPdfClaimed = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isDocxClaimed = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx");

  if (isPdfClaimed) {
    // Verify PDF header magic bytes '%PDF' within the first 1024 bytes
    const headerPrefix = buffer.subarray(0, Math.min(buffer.length, 1024)).toString("ascii");
    if (!headerPrefix.includes("%PDF")) {
      throw new Error("INVALID_PDF: File claims to be PDF but lacks valid '%PDF' header magic signature.");
    }
    extractedText = await parsePdfBuffer(buffer);
  } else if (isDocxClaimed) {
    // Verify ZIP container magic bytes 'PK\x03\x04'
    if (buffer.length >= 4 && !(buffer[0] === 0x50 && buffer[1] === 0x4B && (buffer[2] === 0x03 || buffer[2] === 0x05))) {
      throw new Error("INVALID_DOCX: File claims to be Word Document but lacks valid ZIP magic signature.");
    }
    extractedText = await parseDocxBuffer(buffer);
  } else {
    // Plain text validation: ensure buffer does not contain high ratios of null bytes (binary disguised as text)
    let nullBytes = 0;
    const sampleLength = Math.min(buffer.length, 512);
    for (let i = 0; i < sampleLength; i++) {
      if (buffer[i] === 0) nullBytes++;
    }
    if (nullBytes > sampleLength * 0.1) {
      throw new Error("UNSUPPORTED_BINARY: File contains binary data not recognized as PDF, DOCX, or text.");
    }
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
