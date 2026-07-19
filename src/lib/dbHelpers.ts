import fs from "fs";
import path from "path";

// Enterprise Types matching specified specifications
export interface User {
  id: string; // UUID / Secure String Primary Key
  fullName: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  profilePhoto: string;
  role: "candidate" | "admin";
  provider: "local" | "google" | "github" | "linkedin";
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  lastLogin?: string;
  accountStatus: "active" | "inactive" | "blocked";
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string; // Session ID
  userId: string;
  device: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  country: string;
  loginTime: string;
  logoutTime?: string;
  refreshToken: string;
  isActive: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  activityName: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface InterviewHistory {
  id: string;
  userId: string;
  company: string;
  role: string;
  difficulty: "Entry" | "Mid" | "Senior" | "Expert";
  score: number;
  timeTaken: string;
  questionsAsked: Array<{ id: number; text: string; type: string }>;
  feedback: {
    overallRating: string;
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    mistakesMade?: string[];
    idealAnswers?: string[];
    hiringRecommendation?: string;
    practicePlan?: string[];
    panelFeedback?: any;
    interviewerCount?: number;
  };
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  resumeName: string;
  atsScore: number;
  fileUrl: string;
  createdAt: string;
}

export interface ApplicationTracker {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: "Screening" | "Interview Scheduled" | "Rejected" | "Offer Extended";
  interviewDate?: string;
  notes?: string;
  appliedAt: string;
}

interface DatabaseSchema {
  users: User[];
  sessions: UserSession[];
  activities: UserActivity[];
  interviews: InterviewHistory[];
  resumes: Resume[];
  applications: ApplicationTracker[];
}

const DB_FILE = path.join(process.cwd(), "local_database.json");

let cachedDb: DatabaseSchema | null = null;

export function invalidateDbCache(): void {
  cachedDb = null;
}

// Read and cache the database
function loadDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }

  let db: DatabaseSchema;
  let hasChanged = false;

  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } else {
      db = {
        users: [],
        sessions: [],
        activities: [],
        interviews: [],
        resumes: [],
        applications: []
      };
      hasChanged = true;
    }
  } catch (error) {
    console.error("Failed to load local database, resetting:", error);
    db = {
      users: [],
      sessions: [],
      activities: [],
      interviews: [],
      resumes: [],
      applications: []
    };
    hasChanged = true;
  }

  // Ensure pre-seeded admin user exists
  const hasAdmin = db.users.some(u => u.email === "admin@coach.ai");
  if (!hasAdmin) {
    db.users.push({
      id: "admin-user",
      fullName: "System Administrator",
      email: "admin@coach.ai",
      phoneNumber: "+1 (555) 019-9999",
      passwordHash: "$2a$10$Rz2R2gB1qVvMymH.1nZlDeX2qgX6rVjE7r7qF2K1KkYI0XhC0p3aW", // AdminPassword123!
      profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      role: "admin",
      provider: "local",
      emailVerified: true,
      accountStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    hasChanged = true;
  }

  // Ensure pre-seeded candidate user exists
  const hasCandidate = db.users.some(u => u.email === "candidate@example.com");
  if (!hasCandidate) {
    db.users.push({
      id: "default-user",
      fullName: "Candidate Engineer",
      email: "candidate@example.com",
      phoneNumber: "+1 (555) 019-2834",
      passwordHash: "$2a$10$Rz2R2gB1qVvMymH.1nZlDeX2qgX6rVjE7r7qF2K1KkYI0XhC0p3aW", // AdminPassword123!
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
      role: "candidate",
      provider: "local",
      emailVerified: true,
      accountStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    hasChanged = true;
  }

  // Ensure pre-seeded suchitchavhan889@gmail.com admin user exists
  const hasSuchitUser = db.users.some(u => u.email === "suchitchavhan889@gmail.com");
  if (!hasSuchitUser) {
    db.users.push({
      id: "u-suchitchavhan889",
      fullName: "suchit",
      email: "suchitchavhan889@gmail.com",
      phoneNumber: "+91 9999999966",
      passwordHash: "$2b$10$Q9GzHIdvtHPqp88OkqPrFOZELHUlZFhXHvPtrElRw7QdzNKp3CqPq", // Password matching "Such@21072001"
      profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      role: "admin",
      provider: "local",
      emailVerified: true,
      accountStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    hasChanged = true;
  } else {
    const idx = db.users.findIndex(u => u.email === "suchitchavhan889@gmail.com");
    if (idx !== -1 && (db.users[idx].role !== "admin" || db.users[idx].accountStatus !== "active")) {
      db.users[idx].role = "admin";
      db.users[idx].accountStatus = "active";
      hasChanged = true;
    }
  }

  // Also make sure suchitc220@gmail.com is admin if they exist
  const idxC220 = db.users.findIndex(u => u.email === "suchitc220@gmail.com");
  if (idxC220 !== -1 && (db.users[idxC220].role !== "admin" || db.users[idxC220].accountStatus !== "active")) {
    db.users[idxC220].role = "admin";
    db.users[idxC220].accountStatus = "active";
    hasChanged = true;
  }

  cachedDb = db;

  if (hasChanged) {
    saveDb(db);
  }

  return db;
}

function saveDb(data: DatabaseSchema): void {
  cachedDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to local database file:", error);
  }
}

// Helper to generate IDs
export const generateId = () => "id-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// 1. Users Queries
export async function getUserById(id: string): Promise<User | null> {
  const db = loadDb();
  const user = db.users.find(u => u.id === id);
  return user || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = loadDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  return user || null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const db = loadDb();
  const user = db.users.find(u => u.phoneNumber === phone.trim());
  return user || null;
}

export async function createUser(user: User): Promise<void> {
  const db = loadDb();
  db.users.push(user);
  saveDb(db);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  const db = loadDb();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDb(db);
  }
}

export async function deleteUser(id: string): Promise<void> {
  const db = loadDb();
  db.users = db.users.filter(u => u.id !== id);
  db.sessions = db.sessions.filter(s => s.userId !== id);
  db.activities = db.activities.filter(a => a.userId !== id);
  db.interviews = db.interviews.filter(i => i.userId !== id);
  db.resumes = db.resumes.filter(r => r.userId !== id);
  db.applications = db.applications.filter(ap => ap.userId !== id);
  saveDb(db);
}

export async function getAllUsers(): Promise<User[]> {
  const db = loadDb();
  return db.users;
}

// 2. User Sessions Queries
export async function createSession(session: UserSession): Promise<void> {
  const db = loadDb();
  db.sessions.push(session);
  saveDb(db);
}

export async function getSession(id: string): Promise<UserSession | null> {
  const db = loadDb();
  const session = db.sessions.find(s => s.id === id);
  return session || null;
}

export async function getSessionByRefreshToken(token: string): Promise<UserSession | null> {
  const db = loadDb();
  const session = db.sessions.find(s => s.refreshToken === token && s.isActive === true);
  return session || null;
}

export async function invalidateSession(id: string): Promise<void> {
  const db = loadDb();
  const idx = db.sessions.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.sessions[idx].isActive = false;
    db.sessions[idx].logoutTime = new Date().toISOString();
    saveDb(db);
  }
}

export async function getActiveSessionsForUser(userId: string): Promise<UserSession[]> {
  const db = loadDb();
  return db.sessions.filter(s => s.userId === userId);
}

// 3. User Activity Log
export async function logActivity(activity: Omit<UserActivity, "id" | "timestamp">): Promise<void> {
  const id = generateId();
  const timestamp = new Date().toISOString();
  const db = loadDb();
  db.activities.push({ id, ...activity, timestamp });
  saveDb(db);
}

export async function getActivitiesForUser(userId: string): Promise<UserActivity[]> {
  const db = loadDb();
  const list = db.activities.filter(a => a.userId === userId);
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getAllActivities(): Promise<UserActivity[]> {
  const db = loadDb();
  return db.activities.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// 4. Interview History
export async function saveInterviewHistory(interview: InterviewHistory): Promise<void> {
  const db = loadDb();
  db.interviews.push(interview);
  saveDb(db);
}

export async function getInterviewsForUser(userId: string): Promise<InterviewHistory[]> {
  const db = loadDb();
  const list = db.interviews.filter(i => i.userId === userId);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 5. Resume Table
export async function saveResume(resume: Resume): Promise<void> {
  const db = loadDb();
  db.resumes.push(resume);
  saveDb(db);
}

export async function getResumesForUser(userId: string): Promise<Resume[]> {
  const db = loadDb();
  return db.resumes.filter(r => r.userId === userId);
}

export async function deleteResume(id: string): Promise<void> {
  const db = loadDb();
  db.resumes = db.resumes.filter(r => r.id !== id);
  saveDb(db);
}

// 6. Application Tracker
export async function saveApplication(app: ApplicationTracker): Promise<void> {
  const db = loadDb();
  db.applications.push(app);
  saveDb(db);
}

export async function getApplicationsForUser(userId: string): Promise<ApplicationTracker[]> {
  const db = loadDb();
  const list = db.applications.filter(a => a.userId === userId);
  return list.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}
