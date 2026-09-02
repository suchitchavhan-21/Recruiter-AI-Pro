export interface TextChunk {
  section: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

const SECTION_HEADERS: Record<string, RegExp> = {
  Summary: /^(summary|professional summary|executive summary|about me|profile|overview)/i,
  Experience: /^(experience|work experience|employment history|professional experience|career history)/i,
  Projects: /^(projects|personal projects|key projects|technical projects|portfolio)/i,
  Skills: /^(skills|technical skills|core competencies|proficiencies|technologies|tools)/i,
  Education: /^(education|academic background|qualifications|degrees)/i,
  Certifications: /^(certifications|licenses|courses|accreditations|awards)/i,
  Achievements: /^(achievements|honors|publications|patents|milestones)/i
};

/**
 * Splits document text into section-aware semantic chunks while preserving context.
 */
export function chunkDocumentBySection(
  text: string,
  maxChunkCharacters: number = 800,
  overlapCharacters: number = 100
): TextChunk[] {
  const lines = text.split(/\r?\n/);
  const chunks: TextChunk[] = [];
  
  let currentSection = "General";
  let currentBuffer: string[] = [];
  let chunkIndex = 0;

  function flushBuffer() {
    if (currentBuffer.length === 0) return;
    const combined = currentBuffer.join("\n").trim();
    if (combined.length < 20) return; // skip trivial noise

    // Approximate token count (1 token ~= 4 characters)
    const tokenCount = Math.round(combined.length / 4);

    chunks.push({
      section: currentSection,
      content: combined,
      chunkIndex: chunkIndex++,
      tokenCount
    });

    currentBuffer = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line represents a section header
    let detectedHeader: string | null = null;
    for (const [sectionName, pattern] of Object.entries(SECTION_HEADERS)) {
      if (pattern.test(trimmed.replace(/^#+\s*/, ""))) {
        detectedHeader = sectionName;
        break;
      }
    }

    if (detectedHeader) {
      flushBuffer();
      currentSection = detectedHeader;
      continue;
    }

    currentBuffer.push(trimmed);

    // If buffer exceeds max chunk size, flush with slight overlap
    const currentLength = currentBuffer.reduce((acc, l) => acc + l.length, 0);
    if (currentLength >= maxChunkCharacters) {
      flushBuffer();
    }
  }

  flushBuffer();

  // If no structured sections were found, split by paragraph
  if (chunks.length === 0 && text.trim().length > 0) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    paragraphs.forEach((p, idx) => {
      chunks.push({
        section: "Content",
        content: p.trim(),
        chunkIndex: idx,
        tokenCount: Math.round(p.trim().length / 4)
      });
    });
  }

  return chunks;
}
