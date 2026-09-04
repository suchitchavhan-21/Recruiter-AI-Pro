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
  CandidateMemoryRecord,
  CandidateMemoryProfile,
  AdminAuditLog, 
  DatabaseState 
} from "./schema";
import { ENV } from "../config/env";
import { queryPostgres, isPostgresActive } from "./postgres";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "recruiter_ai_prod.json");

let dbCache: DatabaseState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export function generateUUID(): string {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + crypto.randomBytes(16).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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
    candidateMemories: [],
    auditLogs: []
  };
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
    } catch {
      state = initDefaultState();
    }
  } else {
    state = initDefaultState();
    persistDatabaseSync(state);
  }

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
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM users WHERE id = $1;", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phoneNumber: r.phone_number,
      passwordHash: r.password_hash,
      profilePhoto: r.profile_photo,
      role: r.role,
      provider: r.provider,
      emailVerified: r.email_verified,
      verificationToken: r.verification_token,
      resetPasswordToken: r.reset_password_token,
      resetPasswordExpires: r.reset_password_expires,
      lastLogin: r.last_login,
      accountStatus: r.account_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.users.find(u => u.id === id) || null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const clean = email.toLowerCase().trim();
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM users WHERE LOWER(email) = LOWER($1);", [clean]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phoneNumber: r.phone_number,
      passwordHash: r.password_hash,
      profilePhoto: r.profile_photo,
      role: r.role,
      provider: r.provider,
      emailVerified: r.email_verified,
      verificationToken: r.verification_token,
      resetPasswordToken: r.reset_password_token,
      resetPasswordExpires: r.reset_password_expires,
      lastLogin: r.last_login,
      accountStatus: r.account_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.users.find(u => u.email.toLowerCase() === clean) || null;
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const clean = phone.trim();
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM users WHERE phone_number = $1;", [clean]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phoneNumber: r.phone_number,
      passwordHash: r.password_hash,
      profilePhoto: r.profile_photo,
      role: r.role,
      provider: r.provider,
      emailVerified: r.email_verified,
      verificationToken: r.verification_token,
      resetPasswordToken: r.reset_password_token,
      resetPasswordExpires: r.reset_password_expires,
      lastLogin: r.last_login,
      accountStatus: r.account_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.users.find(u => u.phoneNumber === clean) || null;
}

export async function findUserByVerificationToken(token: string): Promise<User | null> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM users WHERE verification_token = $1;", [token]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phoneNumber: r.phone_number,
      passwordHash: r.password_hash,
      profilePhoto: r.profile_photo,
      role: r.role,
      provider: r.provider,
      emailVerified: r.email_verified,
      verificationToken: r.verification_token,
      resetPasswordToken: r.reset_password_token,
      resetPasswordExpires: r.reset_password_expires,
      lastLogin: r.last_login,
      accountStatus: r.account_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.users.find(u => u.verificationToken === token) || null;
}

export async function findUserByResetToken(token: string): Promise<User | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2;", [token, now]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phoneNumber: r.phone_number,
      passwordHash: r.password_hash,
      profilePhoto: r.profile_photo,
      role: r.role,
      provider: r.provider,
      emailVerified: r.email_verified,
      verificationToken: r.verification_token,
      resetPasswordToken: r.reset_password_token,
      resetPasswordExpires: r.reset_password_expires,
      lastLogin: r.last_login,
      accountStatus: r.account_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.users.find(u => 
    u.resetPasswordToken === token && 
    u.resetPasswordExpires && 
    u.resetPasswordExpires > now
  ) || null;
}

export async function insertUser(user: User): Promise<User> {
  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO users (
        id, full_name, email, phone_number, password_hash, profile_photo,
        role, provider, email_verified, verification_token, reset_password_token,
        reset_password_expires, last_login, account_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone_number = EXCLUDED.phone_number,
        password_hash = EXCLUDED.password_hash,
        profile_photo = EXCLUDED.profile_photo,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified,
        account_status = EXCLUDED.account_status,
        updated_at = NOW();
    `, [
      user.id, user.fullName, user.email, user.phoneNumber, user.passwordHash,
      user.profilePhoto, user.role, user.provider, user.emailVerified,
      user.verificationToken, user.resetPasswordToken, user.resetPasswordExpires,
      user.lastLogin, user.accountStatus
    ]);
    return user;
  }

  const db = loadDatabase();
  const existingIdx = db.users.findIndex(u => u.id === user.id);
  if (existingIdx !== -1) {
    db.users[existingIdx] = user;
  } else {
    db.users.push(user);
  }
  await persistDatabaseAsync();
  return user;
}

export async function updateUserById(id: string, updates: Partial<User>): Promise<User | null> {
  if (isPostgresActive()) {
    const existing = await findUserById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await insertUser(updated);
    return updated;
  }

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
  if (isPostgresActive()) {
    const res = await queryPostgres("DELETE FROM users WHERE id = $1;", [id]);
    return (res.rowCount || 0) > 0;
  }

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
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM users ORDER BY created_at DESC;");
    return res.rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phoneNumber: r.phone_number,
      passwordHash: r.password_hash,
      profilePhoto: r.profile_photo,
      role: r.role,
      provider: r.provider,
      emailVerified: r.email_verified,
      verificationToken: r.verification_token,
      resetPasswordToken: r.reset_password_token,
      resetPasswordExpires: r.reset_password_expires,
      lastLogin: r.last_login,
      accountStatus: r.account_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  const db = loadDatabase();
  return [...db.users];
}

// ----------------------------------------------------
// SESSION REPOSITORY
// ----------------------------------------------------

export async function insertSession(session: UserSession): Promise<void> {
  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO sessions (
        id, user_id, device, browser, operating_system, ip_address,
        country, login_time, logout_time, refresh_token_hash, is_active, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
    `, [
      session.id, session.userId, session.device, session.browser,
      session.operatingSystem, session.ipAddress, session.country,
      session.loginTime, session.logoutTime, session.refreshTokenHash,
      session.isActive, session.expiresAt
    ]);
    return;
  }

  const db = loadDatabase();
  db.sessions.push(session);
  await persistDatabaseAsync();
}

export async function findSessionById(id: string): Promise<UserSession | null> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM sessions WHERE id = $1;", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      device: r.device,
      browser: r.browser,
      operatingSystem: r.operating_system,
      ipAddress: r.ip_address,
      country: r.country,
      loginTime: r.login_time,
      logoutTime: r.logout_time,
      refreshTokenHash: r.refresh_token_hash,
      isActive: r.is_active,
      expiresAt: r.expires_at
    };
  }

  const db = loadDatabase();
  return db.sessions.find(s => s.id === id) || null;
}

export async function findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const res = await queryPostgres(
      "SELECT * FROM sessions WHERE refresh_token_hash = $1 AND is_active = TRUE AND expires_at > $2;",
      [tokenHash, now]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      device: r.device,
      browser: r.browser,
      operatingSystem: r.operating_system,
      ipAddress: r.ip_address,
      country: r.country,
      loginTime: r.login_time,
      logoutTime: r.logout_time,
      refreshTokenHash: r.refresh_token_hash,
      isActive: r.is_active,
      expiresAt: r.expires_at
    };
  }

  const db = loadDatabase();
  return db.sessions.find(s => s.refreshTokenHash === tokenHash && s.isActive && s.expiresAt > now) || null;
}

/**
 * Atomically consumes an active refresh token session and records a new rotated session.
 * Enforces strict single-use semantics: concurrent requests presenting the same token
 * will result in exactly ONE successful rotation; all competing requests fail immediately.
 */
export async function rotateSessionAtomically(
  oldTokenHash: string,
  newSession: UserSession
): Promise<{ success: boolean; oldSession?: { id: string; userId: string } }> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    // 1. Atomically invalidate the active session in a single statement
    const updateRes = await queryPostgres(
      `UPDATE sessions 
       SET is_active = FALSE, logout_time = $1 
       WHERE refresh_token_hash = $2 AND is_active = TRUE AND expires_at > $1
       RETURNING id, user_id;`,
      [now, oldTokenHash]
    );

    if ((updateRes.rowCount ?? 0) === 0 || updateRes.rows.length === 0) {
      return { success: false };
    }

    const consumed = updateRes.rows[0];

    // 2. Insert the fresh rotated session
    await insertSession(newSession);

    return {
      success: true,
      oldSession: {
        id: consumed.id,
        userId: consumed.user_id
      }
    };
  }

  const db = loadDatabase();
  const idx = db.sessions.findIndex(
    s => s.refreshTokenHash === oldTokenHash && s.isActive && s.expiresAt > now
  );
  if (idx === -1) {
    return { success: false };
  }

  const old = db.sessions[idx];
  old.isActive = false;
  old.logoutTime = now;
  db.sessions.push(newSession);
  await persistDatabaseAsync();

  return {
    success: true,
    oldSession: {
      id: old.id,
      userId: old.userId
    }
  };
}

export async function revokeSessionById(id: string, userId?: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    let sql = "UPDATE sessions SET is_active = FALSE, logout_time = $1 WHERE id = $2";
    const params: any[] = [now, id];
    if (userId) {
      sql += " AND user_id = $3";
      params.push(userId);
    }
    const res = await queryPostgres(sql + ";", params);
    return (res.rowCount ?? 0) > 0;
  }

  const db = loadDatabase();
  const session = db.sessions.find(s => s.id === id && (!userId || s.userId === userId));
  if (session && session.isActive) {
    session.isActive = false;
    session.logoutTime = now;
    await persistDatabaseAsync();
    return true;
  }
  return false;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    await queryPostgres("UPDATE sessions SET is_active = FALSE, logout_time = $1 WHERE user_id = $2;", [now, userId]);
    return;
  }

  const db = loadDatabase();
  for (const s of db.sessions) {
    if (s.userId === userId && s.isActive) {
      s.isActive = false;
      s.logoutTime = now;
    }
  }
  await persistDatabaseAsync();
}

export async function listActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
  const now = new Date().toISOString();
  if (isPostgresActive()) {
    const res = await queryPostgres(
      "SELECT * FROM sessions WHERE user_id = $1 AND is_active = TRUE AND expires_at > $2 ORDER BY login_time DESC;",
      [userId, now]
    );
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      device: r.device,
      browser: r.browser,
      operatingSystem: r.operating_system,
      ipAddress: r.ip_address,
      country: r.country,
      loginTime: r.login_time,
      logoutTime: r.logout_time,
      refreshTokenHash: r.refresh_token_hash,
      isActive: r.is_active,
      expiresAt: r.expires_at
    }));
  }

  const db = loadDatabase();
  return db.sessions.filter(s => s.userId === userId && s.isActive && s.expiresAt > now);
}

// ----------------------------------------------------
// ACTIVITY REPOSITORY
// ----------------------------------------------------

export async function insertActivity(activity: Omit<UserActivity, "id" | "timestamp">): Promise<UserActivity> {
  const record: UserActivity = {
    id: generateUUID(),
    ...activity,
    timestamp: new Date().toISOString()
  };

  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO activities (id, user_id, activity_type, activity_name, description, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
      record.id, record.userId, record.activityType, record.activityName,
      record.description, JSON.stringify(record.metadata || {}), record.timestamp
    ]);
    return record;
  }

  const db = loadDatabase();
  db.activities.push(record);
  await persistDatabaseAsync();
  return record;
}

export async function listActivitiesByUserId(userId: string): Promise<UserActivity[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM activities WHERE user_id = $1 ORDER BY timestamp DESC;", [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      activityType: r.activity_type,
      activityName: r.activity_name,
      description: r.description,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : (r.metadata || {}),
      timestamp: r.timestamp
    }));
  }

  const db = loadDatabase();
  return db.activities
    .filter(a => a.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function listAllActivities(): Promise<UserActivity[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM activities ORDER BY timestamp DESC LIMIT 500;");
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      activityType: r.activity_type,
      activityName: r.activity_name,
      description: r.description,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : (r.metadata || {}),
      timestamp: r.timestamp
    }));
  }

  const db = loadDatabase();
  return [...db.activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function clearAllActivities(): Promise<void> {
  if (isPostgresActive()) {
    await queryPostgres("DELETE FROM activities;");
    return;
  }

  const db = loadDatabase();
  db.activities = [];
  await persistDatabaseAsync();
}

// ----------------------------------------------------
// INTERVIEW REPOSITORY
// ----------------------------------------------------

export async function insertInterview(interview: InterviewSessionRecord): Promise<InterviewSessionRecord> {
  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO interviews (
        id, user_id, company, role, difficulty, interviewer_count, persona,
        state, score, time_taken, questions, answers, evaluation, session_state, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        state = EXCLUDED.state,
        score = EXCLUDED.score,
        time_taken = EXCLUDED.time_taken,
        questions = EXCLUDED.questions,
        answers = EXCLUDED.answers,
        evaluation = EXCLUDED.evaluation,
        session_state = EXCLUDED.session_state,
        updated_at = NOW();
    `, [
      interview.id, interview.userId, interview.company, interview.role,
      interview.difficulty, interview.interviewerCount, interview.persona,
      interview.state, interview.score, interview.timeTaken,
      JSON.stringify(interview.questions || []),
      JSON.stringify(interview.answers || []),
      JSON.stringify(interview.evaluation || {}),
      JSON.stringify(interview.sessionState || {})
    ]);
    return interview;
  }

  const db = loadDatabase();
  const existingIdx = db.interviews.findIndex(i => i.id === interview.id);
  if (existingIdx !== -1) {
    db.interviews[existingIdx] = { ...db.interviews[existingIdx], ...interview, updatedAt: new Date().toISOString() };
  } else {
    db.interviews.push(interview);
  }
  await persistDatabaseAsync();
  return interview;
}

export async function findInterviewById(id: string): Promise<InterviewSessionRecord | null> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM interviews WHERE id = $1;", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      company: r.company,
      role: r.role,
      difficulty: r.difficulty,
      interviewerCount: r.interviewer_count,
      persona: r.persona,
      state: r.state,
      score: r.score,
      timeTaken: r.time_taken,
      questions: typeof r.questions === "string" ? JSON.parse(r.questions) : (r.questions || []),
      answers: typeof r.answers === "string" ? JSON.parse(r.answers) : (r.answers || []),
      evaluation: typeof r.evaluation === "string" ? JSON.parse(r.evaluation) : (r.evaluation || {}),
      sessionState: typeof r.session_state === "string" ? JSON.parse(r.session_state) : (r.session_state || {}),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.interviews.find(i => i.id === id) || null;
}

export async function updateInterviewById(id: string, updates: Partial<InterviewSessionRecord>): Promise<InterviewSessionRecord | null> {
  const existing = await findInterviewById(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await insertInterview(updated);
  return updated;
}

/**
 * Optimistically and atomically advances interview turn in PostgreSQL.
 * Guarantees cross-instance correctness in multi-container Cloud Run deployments.
 */
export async function updateInterviewTurnAtomically(
  sessionId: string,
  expectedTurn: number,
  updatedState: any
): Promise<{ success: boolean; currentState?: any }> {
  if (isPostgresActive()) {
    const res = await queryPostgres(
      `UPDATE interviews
       SET session_state = $1, updated_at = NOW()
       WHERE id = $2 
         AND (
           (session_state->>'currentTurn')::int = $3
           OR session_state->>'currentTurn' IS NULL
         )
       RETURNING session_state;`,
      [JSON.stringify(updatedState), sessionId, expectedTurn]
    );

    if (res.rows.length === 0) {
      // Concurrency conflict: another Cloud Run instance already advanced this turn
      const fresh = await findInterviewById(sessionId);
      return {
        success: false,
        currentState: fresh?.sessionState
      };
    }

    return { success: true };
  }

  const db = loadDatabase();
  const existing = db.interviews.find(i => i.id === sessionId);
  if (!existing) return { success: false };
  existing.sessionState = updatedState;
  existing.updatedAt = new Date().toISOString();
  await persistDatabaseAsync();
  return { success: true };
}

export async function listInterviewsByUserId(userId: string): Promise<InterviewSessionRecord[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM interviews WHERE user_id = $1 ORDER BY created_at DESC;", [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      company: r.company,
      role: r.role,
      difficulty: r.difficulty,
      interviewerCount: r.interviewer_count,
      persona: r.persona,
      state: r.state,
      score: r.score,
      timeTaken: r.time_taken,
      questions: typeof r.questions === "string" ? JSON.parse(r.questions) : (r.questions || []),
      answers: typeof r.answers === "string" ? JSON.parse(r.answers) : (r.answers || []),
      evaluation: typeof r.evaluation === "string" ? JSON.parse(r.evaluation) : (r.evaluation || {}),
      sessionState: typeof r.session_state === "string" ? JSON.parse(r.session_state) : (r.session_state || {}),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  const db = loadDatabase();
  return db.interviews
    .filter(i => i.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ----------------------------------------------------
// RESUME REPOSITORY
// ----------------------------------------------------

export async function insertResume(resume: ResumeRecord): Promise<ResumeRecord> {
  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO resumes (
        id, user_id, resume_name, file_size, file_mime_type, ats_score,
        match_score, target_role, parsed_content, analysis, suggestions, file_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        resume_name = EXCLUDED.resume_name,
        ats_score = EXCLUDED.ats_score,
        match_score = EXCLUDED.match_score,
        target_role = EXCLUDED.target_role,
        parsed_content = EXCLUDED.parsed_content,
        analysis = EXCLUDED.analysis,
        suggestions = EXCLUDED.suggestions,
        file_url = EXCLUDED.file_url,
        updated_at = NOW();
    `, [
      resume.id, resume.userId, resume.resumeName, resume.fileSize, resume.fileMimeType,
      resume.atsScore, resume.matchScore, resume.targetRole, resume.parsedContent,
      JSON.stringify(resume.analysis || {}), JSON.stringify(resume.suggestions || []),
      resume.fileUrl
    ]);
    return resume;
  }

  const db = loadDatabase();
  const existingIdx = db.resumes.findIndex(r => r.id === resume.id);
  if (existingIdx !== -1) {
    db.resumes[existingIdx] = { ...db.resumes[existingIdx], ...resume, updatedAt: new Date().toISOString() };
  } else {
    db.resumes.push(resume);
  }
  await persistDatabaseAsync();
  return resume;
}

export async function findResumeById(id: string): Promise<ResumeRecord | null> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM resumes WHERE id = $1;", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      resumeName: r.resume_name,
      fileSize: r.file_size,
      fileMimeType: r.file_mime_type,
      atsScore: r.ats_score,
      matchScore: r.match_score,
      targetRole: r.target_role,
      parsedContent: r.parsed_content,
      analysis: typeof r.analysis === "string" ? JSON.parse(r.analysis) : (r.analysis || {}),
      suggestions: typeof r.suggestions === "string" ? JSON.parse(r.suggestions) : (r.suggestions || []),
      fileUrl: r.file_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  return db.resumes.find(r => r.id === id) || null;
}

export async function listResumesByUserId(userId: string): Promise<ResumeRecord[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC;", [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      resumeName: r.resume_name,
      fileSize: r.file_size,
      fileMimeType: r.file_mime_type,
      atsScore: r.ats_score,
      matchScore: r.match_score,
      targetRole: r.target_role,
      parsedContent: r.parsed_content,
      analysis: typeof r.analysis === "string" ? JSON.parse(r.analysis) : (r.analysis || {}),
      suggestions: typeof r.suggestions === "string" ? JSON.parse(r.suggestions) : (r.suggestions || []),
      fileUrl: r.file_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  const db = loadDatabase();
  return db.resumes
    .filter(r => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteResumeById(id: string, userId: string): Promise<boolean> {
  if (isPostgresActive()) {
    const res = await queryPostgres("DELETE FROM resumes WHERE id = $1 AND user_id = $2;", [id, userId]);
    return (res.rowCount || 0) > 0;
  }

  const db = loadDatabase();
  const initialLength = db.resumes.length;
  db.resumes = db.resumes.filter(r => !(r.id === id && r.userId === userId));
  await persistDatabaseAsync();
  return db.resumes.length < initialLength;
}

// ----------------------------------------------------
// APPLICATION REPOSITORY
// ----------------------------------------------------

export async function insertApplication(app: JobApplicationRecord): Promise<JobApplicationRecord> {
  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO applications (
        id, user_id, company, role, role_category, applicant_name,
        applicant_email, status, cover_letter, match_score, notes, interview_date, applied_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        interview_date = EXCLUDED.interview_date,
        updated_at = NOW();
    `, [
      app.id, app.userId, app.company, app.role, app.roleCategory,
      app.applicantName, app.applicantEmail, app.status, app.coverLetter,
      app.matchScore, app.notes, app.interviewDate
    ]);
    return app;
  }

  const db = loadDatabase();
  db.applications.push(app);
  await persistDatabaseAsync();
  return app;
}

export async function listApplicationsByUserId(userId: string): Promise<JobApplicationRecord[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM applications WHERE user_id = $1 ORDER BY applied_at DESC;", [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      company: r.company,
      role: r.role,
      roleCategory: r.role_category,
      applicantName: r.applicant_name,
      applicantEmail: r.applicant_email,
      status: r.status,
      coverLetter: r.cover_letter,
      matchScore: r.match_score,
      notes: r.notes,
      interviewDate: r.interview_date,
      appliedAt: r.applied_at,
      updatedAt: r.updated_at
    }));
  }

  const db = loadDatabase();
  return db.applications
    .filter(a => a.userId === userId)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

export async function updateApplicationStatus(id: string, userId: string, status: JobApplicationRecord["status"]): Promise<JobApplicationRecord | null> {
  if (isPostgresActive()) {
    await queryPostgres("UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3;", [status, id, userId]);
    const res = await queryPostgres("SELECT * FROM applications WHERE id = $1 AND user_id = $2;", [id, userId]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      company: r.company,
      role: r.role,
      roleCategory: r.role_category,
      applicantName: r.applicant_name,
      applicantEmail: r.applicant_email,
      status: r.status,
      coverLetter: r.cover_letter,
      matchScore: r.match_score,
      notes: r.notes,
      interviewDate: r.interview_date,
      appliedAt: r.applied_at,
      updatedAt: r.updated_at
    };
  }

  const db = loadDatabase();
  const app = db.applications.find(a => a.id === id && a.userId === userId);
  if (!app) return null;
  app.status = status;
  app.updatedAt = new Date().toISOString();
  await persistDatabaseAsync();
  return app;
}

// ----------------------------------------------------
// STAR STORY REPOSITORY
// ----------------------------------------------------

export async function insertSTARStory(story: SavedSTARStoryRecord): Promise<SavedSTARStoryRecord> {
  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO star_stories (
        id, user_id, role, company, situation, task, action, result, expert_story, title, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        situation = EXCLUDED.situation,
        task = EXCLUDED.task,
        action = EXCLUDED.action,
        result = EXCLUDED.result,
        expert_story = EXCLUDED.expert_story,
        title = EXCLUDED.title,
        updated_at = NOW();
    `, [
      story.id, story.userId, story.role, story.company, story.situation,
      story.task, story.action, story.result, story.expertStory, story.title
    ]);
    return story;
  }

  const db = loadDatabase();
  db.starStories.push(story);
  await persistDatabaseAsync();
  return story;
}

export async function listSTARStoriesByUserId(userId: string): Promise<SavedSTARStoryRecord[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM star_stories WHERE user_id = $1 ORDER BY created_at DESC;", [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      role: r.role,
      company: r.company,
      situation: r.situation,
      task: r.task,
      action: r.action,
      result: r.result,
      expertStory: r.expert_story,
      title: r.title,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  const db = loadDatabase();
  return db.starStories
    .filter(s => s.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteSTARStoryById(id: string, userId: string): Promise<boolean> {
  if (isPostgresActive()) {
    const res = await queryPostgres("DELETE FROM star_stories WHERE id = $1 AND user_id = $2;", [id, userId]);
    return (res.rowCount || 0) > 0;
  }

  const db = loadDatabase();
  const initialLength = db.starStories.length;
  db.starStories = db.starStories.filter(s => !(s.id === id && s.userId === userId));
  await persistDatabaseAsync();
  return db.starStories.length < initialLength;
}

export async function resetDatabaseState(preserveAdminId?: string): Promise<void> {
  if (process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production") {
    throw new Error("[SECURITY FATAL] resetDatabaseState is strictly prohibited in production environments.");
  }

  if (isPostgresActive()) {
    if (preserveAdminId) {
      await queryPostgres("DELETE FROM users WHERE id != $1;", [preserveAdminId]);
      await queryPostgres("DELETE FROM sessions WHERE user_id != $1;", [preserveAdminId]);
    } else {
      await queryPostgres("TRUNCATE TABLE users, sessions CASCADE;");
    }
    await queryPostgres("TRUNCATE TABLE activities, interviews, resumes, applications, star_stories, audit_logs, vector_chunks CASCADE;");
    return;
  }

  const db = loadDatabase();
  const preservedUser = preserveAdminId ? db.users.find(u => u.id === preserveAdminId) : null;
  const preservedSessions = preserveAdminId ? db.sessions.filter(s => s.userId === preserveAdminId) : [];

  dbCache = {
    ...initDefaultState(),
    users: preservedUser ? [preservedUser] : [],
    sessions: preservedSessions
  };
  persistDatabaseSync(dbCache);
}

// ----------------------------------------------------
// AUDIT LOG REPOSITORY
// ----------------------------------------------------

export async function insertAuditLog(log: Omit<AdminAuditLog, "id" | "timestamp">): Promise<AdminAuditLog> {
  const record: AdminAuditLog = {
    id: generateUUID(),
    ...log,
    timestamp: new Date().toISOString()
  };

  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO audit_logs (id, admin_user_id, admin_email, action, target_user_id, details, ip_address, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      record.id, record.adminUserId, record.adminEmail, record.action,
      record.targetUserId, record.details, record.ipAddress, record.timestamp
    ]);
    return record;
  }

  const db = loadDatabase();
  db.auditLogs.push(record);
  await persistDatabaseAsync();
  return record;
}

export async function listAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1;", [limit]);
    return res.rows.map(r => ({
      id: r.id,
      adminUserId: r.admin_user_id,
      adminEmail: r.admin_email,
      action: r.action,
      targetUserId: r.target_user_id,
      details: r.details,
      ipAddress: r.ip_address,
      timestamp: r.timestamp
    }));
  }

  const db = loadDatabase();
  return [...db.auditLogs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

// ==========================================
// CANDIDATE MEMORY REPOSITORY
// ==========================================

export async function getCandidateMemoryByUserId(userId: string): Promise<CandidateMemoryProfile | null> {
  if (isPostgresActive()) {
    const res = await queryPostgres("SELECT profile FROM candidate_memories WHERE user_id = $1;", [userId]);
    if (res.rows.length === 0) return null;
    return res.rows[0].profile as CandidateMemoryProfile;
  }

  const db = loadDatabase();
  const entry = (db.candidateMemories || []).find(m => m.userId === userId);
  return entry ? entry.profile : null;
}

export async function saveCandidateMemory(userId: string, profile: CandidateMemoryProfile): Promise<void> {
  const updatedAt = new Date().toISOString();
  profile.updatedAt = updatedAt;

  if (isPostgresActive()) {
    await queryPostgres(`
      INSERT INTO candidate_memories (user_id, profile, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET profile = EXCLUDED.profile, updated_at = EXCLUDED.updated_at;
    `, [userId, JSON.stringify(profile), updatedAt]);
    return;
  }

  const db = loadDatabase();
  if (!db.candidateMemories) db.candidateMemories = [];
  const idx = db.candidateMemories.findIndex(m => m.userId === userId);
  if (idx >= 0) {
    db.candidateMemories[idx].profile = profile;
    db.candidateMemories[idx].updatedAt = updatedAt;
  } else {
    db.candidateMemories.push({
      userId,
      profile,
      updatedAt
    });
  }
  await persistDatabaseAsync();
}
