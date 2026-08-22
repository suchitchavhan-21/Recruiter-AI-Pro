import fs from "fs";
import path from "path";
import crypto from "crypto";
import { 
  User, 
  UserSession, 
  UserActivity, 
  InterviewSessionRecord, 
  ResumeRecord, 
  JobApplicationRecord, 
  SavedSTARStoryRecord, 
  AdminAuditLog, 
  DatabaseState 
} from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "recruiter_ai_prod.json");
const LEGACY_DB_FILE = path.join(process.cwd(), "local_database.json");

// In-memory cache for ultra-fast queries with atomic disk persistence
let dbCache: DatabaseState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function generateUUID(): string {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + crypto.randomBytes(16).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function initDefaultState(): DatabaseState {
  return {
    users: [],
    sessions: [],
    activities: [],
    interviews: [],
    resumes: [],
    applications: [],
    starStories: [],
    auditLogs: []
  };
}

// Migrate legacy database structure to unified normalized structure if needed
function migrateLegacyData(legacyData: any): DatabaseState {
  const state = initDefaultState();
  
  if (Array.isArray(legacyData.users)) {
    state.users = legacyData.users.map((u: any) => ({
      id: u.id || generateUUID(),
      fullName: u.fullName || "Candidate",
      email: (u.email || "").toLowerCase().trim(),
      phoneNumber: u.phoneNumber || "",
      passwordHash: u.passwordHash || "",
      profilePhoto: u.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      role: u.role === "admin" ? "admin" : "candidate",
      provider: u.provider || "local",
      emailVerified: u.emailVerified ?? true,
      verificationToken: u.verificationToken,
      resetPasswordToken: u.resetPasswordToken,
      resetPasswordExpires: u.resetPasswordExpires,
      lastLogin: u.lastLogin,
      accountStatus: u.accountStatus || "active",
      createdAt: u.createdAt || new Date().toISOString(),
      updatedAt: u.updatedAt || new Date().toISOString()
    }));
  }

  if (Array.isArray(legacyData.sessions)) {
    state.sessions = legacyData.sessions.map((s: any) => ({
      id: s.id || generateUUID(),
      userId: s.userId,
      device: s.device || "Desktop",
      browser: s.browser || "Chrome",
      operatingSystem: s.operatingSystem || "macOS",
      ipAddress: s.ipAddress || "127.0.0.1",
      country: s.country || "US",
      loginTime: s.loginTime || new Date().toISOString(),
      logoutTime: s.logoutTime,
      refreshTokenHash: s.refreshToken ? hashToken(s.refreshToken) : (s.refreshTokenHash || ""),
      isActive: s.isActive ?? true,
      expiresAt: s.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  if (Array.isArray(legacyData.activities)) {
    state.activities = legacyData.activities;
  }

  if (Array.isArray(legacyData.interviews)) {
    state.interviews = legacyData.interviews.map((i: any) => ({
      id: i.id || generateUUID(),
      userId: i.userId,
      company: i.company || "General Tech",
      role: i.role || "Software Engineer",
      difficulty: i.difficulty || "Senior",
      interviewerCount: i.interviewerCount || 1,
      persona: i.persona || "mentor",
      state: "COMPLETED",
      score: typeof i.score === "number" ? i.score : 85,
      timeTaken: i.timeTaken || "15m",
      questions: Array.isArray(i.questionsAsked) ? i.questionsAsked : [],
      answers: Array.isArray(i.answers) ? i.answers : [],
      evaluation: i.feedback || { overallRating: "Strong Hire", overallFeedback: "Good session.", strengths: [], improvements: [] },
      createdAt: i.createdAt || new Date().toISOString(),
      updatedAt: i.updatedAt || new Date().toISOString()
    }));
  }

  if (Array.isArray(legacyData.resumes)) {
    state.resumes = legacyData.resumes.map((r: any) => ({
      id: r.id || generateUUID(),
      userId: r.userId,
      resumeName: r.resumeName || "Resume.pdf",
      fileSize: r.fileSize || 102400,
      fileMimeType: r.fileMimeType || "application/pdf",
      atsScore: r.atsScore || 75,
      matchScore: r.matchScore,
      targetRole: r.targetRole,
      parsedContent: r.parsedContent,
      analysis: r.analysis,
      suggestions: r.suggestions,
      fileUrl: r.fileUrl,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString()
    }));
  }

  if (Array.isArray(legacyData.applications)) {
    state.applications = legacyData.applications.map((a: any) => ({
      id: a.id || generateUUID(),
      userId: a.userId,
      company: a.company,
      role: a.role,
      roleCategory: a.roleCategory || "Engineering",
      applicantName: a.applicantName || "Candidate",
      applicantEmail: a.applicantEmail || "candidate@example.com",
      status: a.status || "Screening",
      coverLetter: a.coverLetter,
      matchScore: a.matchScore,
      notes: a.notes,
      interviewDate: a.interviewDate,
      appliedAt: a.appliedAt || new Date().toISOString(),
      updatedAt: a.updatedAt || new Date().toISOString()
    }));
  }

  return state;
}

function loadDatabase(): DatabaseState {
  if (dbCache) {
    return dbCache;
  }

  ensureDataDirectory();

  let state: DatabaseState;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      state = JSON.parse(raw);
    } catch (err) {
      console.error("[DB ERROR] Failed to parse primary database file, attempting recovery from legacy file:", err);
      state = initDefaultState();
    }
  } else if (fs.existsSync(LEGACY_DB_FILE)) {
    try {
      console.log("[DB MIGRATION] Migrating records from local_database.json into primary database...");
      const rawLegacy = fs.readFileSync(LEGACY_DB_FILE, "utf-8");
      state = migrateLegacyData(JSON.parse(rawLegacy));
      persistDatabaseSync(state);
      console.log(`[DB MIGRATION COMPLETE] Loaded ${state.users.length} users, ${state.interviews.length} interviews, ${state.applications.length} applications.`);
    } catch (err) {
      console.error("[DB MIGRATION ERROR] Failed migrating legacy data:", err);
      state = initDefaultState();
    }
  } else {
    state = initDefaultState();
    persistDatabaseSync(state);
  }

  // Ensure arrays exist
  if (!Array.isArray(state.users)) state.users = [];
  if (!Array.isArray(state.sessions)) state.sessions = [];
  if (!Array.isArray(state.activities)) state.activities = [];
  if (!Array.isArray(state.interviews)) state.interviews = [];
  if (!Array.isArray(state.resumes)) state.resumes = [];
  if (!Array.isArray(state.applications)) state.applications = [];
  if (!Array.isArray(state.starStories)) state.starStories = [];
  if (!Array.isArray(state.auditLogs)) state.auditLogs = [];

  dbCache = state;
  return state;
}

function persistDatabaseSync(state: DatabaseState): void {
  ensureDataDirectory();
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tempPath, DB_FILE);
  dbCache = state;
}

async function persistDatabaseAsync(): Promise<void> {
  if (!dbCache) return;
  const snapshot = JSON.stringify(dbCache, null, 2);
  
  writeQueue = writeQueue.then(async () => {
    ensureDataDirectory();
    const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
    await fs.promises.writeFile(tempPath, snapshot, "utf-8");
    await fs.promises.rename(tempPath, DB_FILE);
  }).catch((err) => {
    console.error("[DB WRITE ERROR] Failed persisting database state:", err);
  });

  return writeQueue;
}

// ----------------------------------------------------
// USER REPOSITORY
// ----------------------------------------------------

export async function findUserById(id: string): Promise<User | null> {
  const db = loadDatabase();
  return db.users.find(u => u.id === id) || null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = loadDatabase();
  const clean = email.toLowerCase().trim();
  return db.users.find(u => u.email.toLowerCase() === clean) || null;
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const db = loadDatabase();
  const clean = phone.trim();
  return db.users.find(u => u.phoneNumber === clean) || null;
}

export async function findUserByVerificationToken(token: string): Promise<User | null> {
  const db = loadDatabase();
  return db.users.find(u => u.verificationToken === token) || null;
}

export async function findUserByResetToken(token: string): Promise<User | null> {
  const db = loadDatabase();
  const now = new Date().toISOString();
  return db.users.find(u => 
    u.resetPasswordToken === token && 
    u.resetPasswordExpires && 
    u.resetPasswordExpires > now
  ) || null;
}

export async function insertUser(user: User): Promise<User> {
  const db = loadDatabase();
  db.users.push(user);
  await persistDatabaseAsync();
  return user;
}

export async function updateUserById(id: string, updates: Partial<User>): Promise<User | null> {
  const db = loadDatabase();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  db.users[idx] = {
    ...db.users[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await persistDatabaseAsync();
  return db.users[idx];
}

export async function deleteUserById(id: string): Promise<boolean> {
  const db = loadDatabase();
  const initialLength = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  db.sessions = db.sessions.filter(s => s.userId !== id);
  db.activities = db.activities.filter(a => a.userId !== id);
  db.interviews = db.interviews.filter(i => i.userId !== id);
  db.resumes = db.resumes.filter(r => r.userId !== id);
  db.applications = db.applications.filter(a => a.userId !== id);
  db.starStories = db.starStories.filter(s => s.userId !== id);

  await persistDatabaseAsync();
  return db.users.length < initialLength;
}

export async function listAllUsers(): Promise<User[]> {
  const db = loadDatabase();
  return [...db.users];
}

// ----------------------------------------------------
// SESSION REPOSITORY
// ----------------------------------------------------

export async function insertSession(session: UserSession): Promise<void> {
  const db = loadDatabase();
  db.sessions.push(session);
  await persistDatabaseAsync();
}

export async function findSessionById(id: string): Promise<UserSession | null> {
  const db = loadDatabase();
  return db.sessions.find(s => s.id === id) || null;
}

export async function findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
  const db = loadDatabase();
  const now = new Date().toISOString();
  return db.sessions.find(s => s.refreshTokenHash === tokenHash && s.isActive && s.expiresAt > now) || null;
}

export async function revokeSessionById(id: string): Promise<void> {
  const db = loadDatabase();
  const session = db.sessions.find(s => s.id === id);
  if (session) {
    session.isActive = false;
    session.logoutTime = new Date().toISOString();
    await persistDatabaseAsync();
  }
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = loadDatabase();
  const now = new Date().toISOString();
  for (const s of db.sessions) {
    if (s.userId === userId && s.isActive) {
      s.isActive = false;
      s.logoutTime = now;
    }
  }
  await persistDatabaseAsync();
}

export async function listActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
  const db = loadDatabase();
  const now = new Date().toISOString();
  return db.sessions.filter(s => s.userId === userId && s.isActive && s.expiresAt > now);
}

// ----------------------------------------------------
// ACTIVITY REPOSITORY
// ----------------------------------------------------

export async function insertActivity(activity: Omit<UserActivity, "id" | "timestamp">): Promise<UserActivity> {
  const db = loadDatabase();
  const record: UserActivity = {
    id: generateUUID(),
    ...activity,
    timestamp: new Date().toISOString()
  };
  db.activities.push(record);
  await persistDatabaseAsync();
  return record;
}

export async function listActivitiesByUserId(userId: string): Promise<UserActivity[]> {
  const db = loadDatabase();
  return db.activities
    .filter(a => a.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function listAllActivities(): Promise<UserActivity[]> {
  const db = loadDatabase();
  return [...db.activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function clearAllActivities(): Promise<void> {
  const db = loadDatabase();
  db.activities = [];
  await persistDatabaseAsync();
}

// ----------------------------------------------------
// INTERVIEW REPOSITORY
// ----------------------------------------------------

export async function insertInterview(interview: InterviewSessionRecord): Promise<InterviewSessionRecord> {
  const db = loadDatabase();
  db.interviews.push(interview);
  await persistDatabaseAsync();
  return interview;
}

export async function findInterviewById(id: string): Promise<InterviewSessionRecord | null> {
  const db = loadDatabase();
  return db.interviews.find(i => i.id === id) || null;
}

export async function updateInterviewById(id: string, updates: Partial<InterviewSessionRecord>): Promise<InterviewSessionRecord | null> {
  const db = loadDatabase();
  const idx = db.interviews.findIndex(i => i.id === id);
  if (idx === -1) return null;

  db.interviews[idx] = {
    ...db.interviews[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await persistDatabaseAsync();
  return db.interviews[idx];
}

export async function listInterviewsByUserId(userId: string): Promise<InterviewSessionRecord[]> {
  const db = loadDatabase();
  return db.interviews
    .filter(i => i.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ----------------------------------------------------
// RESUME REPOSITORY
// ----------------------------------------------------

export async function insertResume(resume: ResumeRecord): Promise<ResumeRecord> {
  const db = loadDatabase();
  db.resumes.push(resume);
  await persistDatabaseAsync();
  return resume;
}

export async function findResumeById(id: string): Promise<ResumeRecord | null> {
  const db = loadDatabase();
  return db.resumes.find(r => r.id === id) || null;
}

export async function updateResumeById(id: string, updates: Partial<ResumeRecord>): Promise<ResumeRecord | null> {
  const db = loadDatabase();
  const idx = db.resumes.findIndex(r => r.id === id);
  if (idx === -1) return null;

  db.resumes[idx] = {
    ...db.resumes[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await persistDatabaseAsync();
  return db.resumes[idx];
}

export async function listResumesByUserId(userId: string): Promise<ResumeRecord[]> {
  const db = loadDatabase();
  return db.resumes
    .filter(r => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteResumeById(id: string, userId: string): Promise<boolean> {
  const db = loadDatabase();
  const initialLength = db.resumes.length;
  db.resumes = db.resumes.filter(r => !(r.id === id && r.userId === userId));
  await persistDatabaseAsync();
  return db.resumes.length < initialLength;
}

// ----------------------------------------------------
// APPLICATION TRACKER REPOSITORY
// ----------------------------------------------------

export async function insertApplication(app: JobApplicationRecord): Promise<JobApplicationRecord> {
  const db = loadDatabase();
  db.applications.push(app);
  await persistDatabaseAsync();
  return app;
}

export async function listApplicationsByUserId(userId: string): Promise<JobApplicationRecord[]> {
  const db = loadDatabase();
  return db.applications
    .filter(a => a.userId === userId)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

export async function updateApplicationStatus(id: string, userId: string, status: JobApplicationRecord["status"]): Promise<boolean> {
  const db = loadDatabase();
  const app = db.applications.find(a => a.id === id && a.userId === userId);
  if (app) {
    app.status = status;
    app.updatedAt = new Date().toISOString();
    await persistDatabaseAsync();
    return true;
  }
  return false;
}

// ----------------------------------------------------
// STAR STORIES REPOSITORY
// ----------------------------------------------------

export async function insertSTARStory(story: SavedSTARStoryRecord): Promise<SavedSTARStoryRecord> {
  const db = loadDatabase();
  db.starStories.push(story);
  await persistDatabaseAsync();
  return story;
}

export async function listSTARStoriesByUserId(userId: string): Promise<SavedSTARStoryRecord[]> {
  const db = loadDatabase();
  return db.starStories
    .filter(s => s.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteSTARStoryById(id: string, userId: string): Promise<boolean> {
  const db = loadDatabase();
  const initialLength = db.starStories.length;
  db.starStories = db.starStories.filter(s => !(s.id === id && s.userId === userId));
  await persistDatabaseAsync();
  return db.starStories.length < initialLength;
}

// ----------------------------------------------------
// ADMIN AUDIT LOG REPOSITORY
// ----------------------------------------------------

export async function insertAuditLog(log: Omit<AdminAuditLog, "id" | "timestamp">): Promise<AdminAuditLog> {
  const db = loadDatabase();
  const entry: AdminAuditLog = {
    id: generateUUID(),
    ...log,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.push(entry);
  await persistDatabaseAsync();
  return entry;
}

export async function listAuditLogs(): Promise<AdminAuditLog[]> {
  const db = loadDatabase();
  return [...db.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// Reset database utility (Admin only)
export async function resetDatabaseState(preserveAdminId?: string): Promise<void> {
  const db = loadDatabase();
  const admins = db.users.filter(u => u.role === "admin" && (!preserveAdminId || u.id === preserveAdminId));
  
  const newState: DatabaseState = {
    users: admins,
    sessions: [],
    activities: [],
    interviews: [],
    resumes: [],
    applications: [],
    starStories: [],
    auditLogs: []
  };

  dbCache = newState;
  persistDatabaseSync(newState);
}
