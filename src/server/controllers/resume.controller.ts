import { Response } from "express";
import multer from "multer";
import { extractDocumentText } from "../services/fileParser.service";
import { scanResumeContent } from "../services/gemini.service";
import { 
  insertResume, 
  listResumesByUserId, 
  deleteResumeById, 
  insertActivity, 
  generateUUID 
} from "../db/repository";
import { ResumeRecord } from "../db/schema";
import { AuthenticatedRequest } from "../middleware/auth";
import { ENV } from "../config/env";
import { 
  indexResumeDocument, 
  deleteResumeVectors, 
  matchJDWithCandidateEvidence 
} from "../ai/rag/pipeline";
import { updateCandidateMemoryFromResume } from "../ai/memory/candidateMemory";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ENV.MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (
      ENV.ALLOWED_MIME_TYPES.includes(file.mimetype) ||
      file.originalname.match(/\.(pdf|docx|doc|txt)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only PDF, DOCX, and TXT files are accepted."));
    }
  }
});

export const resumeUploadMiddleware = upload.single("resume");

// 1. UPLOAD & SCAN RESUME
export async function uploadAndScanResumeHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  let resumeText = "";
  let fileName = "Uploaded_Resume.pdf";
  let fileSize = 102400;
  let mimeType = "application/pdf";
  const targetRole = req.body?.targetRole || "Senior Software Engineer";

  if (req.file) {
    fileName = req.file.originalname;
    fileSize = req.file.size;
    mimeType = req.file.mimetype;

    try {
      const extracted = await extractDocumentText(req.file.buffer, mimeType, fileName);
      resumeText = extracted.text;
    } catch (parseErr: any) {
      return res.status(400).json({
        success: false,
        error: { code: "PARSING_FAILED", message: parseErr.message || "Failed to extract text from document." }
      });
    }
  } else if (req.body?.base64Data) {
    fileName = req.body.fileName || "Uploaded_Resume.pdf";
    mimeType = req.body.fileType || "application/pdf";
    try {
      const buffer = Buffer.from(req.body.base64Data, "base64");
      if (buffer.length > ENV.MAX_FILE_SIZE_BYTES) {
        return res.status(400).json({
          success: false,
          error: { code: "FILE_TOO_LARGE", message: `Decoded file size (${buffer.length} bytes) exceeds maximum allowed limit of ${ENV.MAX_FILE_SIZE_BYTES} bytes.` }
        });
      }
      fileSize = buffer.length;
      const extracted = await extractDocumentText(buffer, mimeType, fileName);
      resumeText = extracted.text;
    } catch (parseErr: any) {
      return res.status(400).json({
        success: false,
        error: { code: "PARSING_FAILED", message: parseErr.message || "Failed to decode and parse document." }
      });
    }
  } else if (req.body?.resumeText) {
    resumeText = req.body.resumeText;
    fileName = req.body.fileName || "Pasted_Resume.txt";
    fileSize = Buffer.byteLength(resumeText, "utf8");
    mimeType = "text/plain";
  } else {
    return res.status(400).json({
      success: false,
      error: { code: "NO_FILE_PROVIDED", message: "Please upload a resume file (PDF/DOCX) or paste resume text." }
    });
  }

  if (resumeText.trim().length < 50) {
    return res.status(400).json({
      success: false,
      error: { code: "INSUFFICIENT_TEXT", message: "Extracted document text was too short to perform an ATS evaluation." }
    });
  }

  try {
    const analysis = await scanResumeContent({
      resumeText,
      targetRole
    });

    const resumeRecord: ResumeRecord = {
      id: generateUUID(),
      userId: req.user.userId,
      resumeName: fileName,
      fileSize,
      fileMimeType: mimeType,
      atsScore: analysis.atsScore,
      matchScore: analysis.atsMatch,
      targetRole,
      parsedContent: resumeText.substring(0, 10000),
      analysis,
      suggestions: analysis.suggestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await insertResume(resumeRecord);

    // Synchronous/Reliable RAG Vector Ingestion
    try {
      await indexResumeDocument({
        resumeId: resumeRecord.id,
        userId: req.user.userId,
        resumeText,
        metadata: {
          resumeName: fileName,
          targetRole,
          atsScore: analysis.atsScore
        }
      });
    } catch (ragErr: any) {
      console.warn("[RAG INGESTION WARNING] Failed to index resume into vector store:", ragErr.message || ragErr);
    }

    // Ingest skills and improvements into Candidate Memory
    try {
      await updateCandidateMemoryFromResume(req.user.userId, resumeRecord.id, resumeText, analysis);
    } catch (memErr: any) {
      console.warn("[CANDIDATE MEMORY WARNING] Failed to update memory from resume:", memErr.message || memErr);
    }

    await insertActivity({
      userId: req.user.userId,
      activityType: "RESUME_SCANNED",
      activityName: "ATS Resume Scan",
      description: `Scanned ${fileName} against ${targetRole}. ATS Score: ${analysis.atsScore}%.`,
      metadata: { atsScore: analysis.atsScore, fileName }
    });

    return res.status(200).json({
      success: true,
      resume: resumeRecord,
      analysis
    });
  } catch (err: any) {
    console.error("[RESUME SCAN ERROR]:", err);
    return res.status(500).json({
      success: false,
      error: { code: "SCAN_FAILED", message: err.message || "Failed to audit resume." }
    });
  }
}

// 2. PARSE JD DOCUMENT (PDF, DOCX, TXT)
export async function parseJDDocumentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: "NO_FILE", message: "No job description document provided." } });
  }

  try {
    const extracted = await extractDocumentText(req.file.buffer, req.file.mimetype, req.file.originalname);
    return res.status(200).json({
      success: true,
      text: extracted.text,
      fileName: req.file.originalname,
      wordCount: extracted.wordCount,
      pageCount: Math.ceil(extracted.charCount / 3000) || 1
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "PARSING_FAILED", message: err.message || "Failed to parse job description file." }
    });
  }
}

// 3. LIST USER RESUMES
export async function listResumesHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const resumes = await listResumesByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    resumes
  });
}

// 4. DELETE RESUME
export async function deleteResumeHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const id = req.params.id;
  const deleted = await deleteResumeById(id, req.user.userId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { code: "RESUME_NOT_FOUND", message: "Resume not found or access denied." }
    });
  }

  // Clean up associated RAG vector chunks
  try {
    await deleteResumeVectors(id, req.user.userId);
  } catch (vecErr: any) {
    console.warn("[RAG CLEANUP WARNING] Failed to delete vector chunks for resume:", vecErr.message || vecErr);
  }

  return res.status(200).json({
    success: true,
    message: "Resume and associated vector embeddings removed."
  });
}

import { calculateEvidenceBasedATSScore } from "../ai/ats/evidenceScorer";

// 5. MATCH RESUME EVIDENCE WITH JOB DESCRIPTION
export async function matchJDEvidenceHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { jd, targetRole } = req.body;
  if (!jd || typeof jd !== "string") {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Job description text is required." } });
  }

  try {
    const matchResults = await matchJDWithCandidateEvidence({
      jdText: jd,
      userId: req.user.userId,
      role: targetRole
    });

    return res.status(200).json({
      success: true,
      ...matchResults
    });
  } catch (err: any) {
    console.error("[JD MATCH ERROR]:", err);
    return res.status(500).json({
      success: false,
      error: { code: "MATCH_FAILED", message: err.message || "Failed to evaluate candidate evidence." }
    });
  }
}

// 6. CALCULATE EVIDENCE-BASED ATS SCORE
export async function calculateATSScoreHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const { jobDescription, jd, jdText, jobId, role, targetRole } = req.body;
  const rawJd = jobDescription || jd || jdText;

  if (!rawJd || typeof rawJd !== "string" || rawJd.trim().length < 10) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_INPUT", message: "Valid job description text is required (minimum 10 characters)." }
    });
  }

  try {
    const atsResult = await calculateEvidenceBasedATSScore({
      userId: req.user.userId,
      jdText: rawJd.trim(),
      jobId,
      role: role || targetRole
    });

    return res.status(200).json({
      success: true,
      ...atsResult
    });
  } catch (err: any) {
    console.error("[ATS SCORE ERROR]:", err);
    return res.status(500).json({
      success: false,
      error: { code: "SCORING_FAILED", message: err.message || "Failed to compute evidence-based ATS score." }
    });
  }
}
