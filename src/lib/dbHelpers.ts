import { 
  findUserById, 
  findUserByEmail, 
  findUserByPhone, 
  insertUser, 
  updateUserById, 
  deleteUserById, 
  listAllUsers, 
  insertSession, 
  findSessionById, 
  findSessionByTokenHash, 
  revokeSessionById, 
  listActiveSessionsByUserId, 
  insertActivity, 
  listActivitiesByUserId, 
  listAllActivities, 
  insertInterview, 
  listInterviewsByUserId, 
  insertResume, 
  listResumesByUserId, 
  deleteResumeById, 
  insertApplication, 
  listApplicationsByUserId, 
  generateUUID, 
  hashToken 
} from "../server/db/repository";
import { User, UserSession, UserActivity } from "../server/db/schema";

export type { User, UserSession, UserActivity };

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
    score?: number;
  };
  createdAt: string;
}

export interface StoredResume {
  id: string;
  userId: string;
  resumeName: string;
  fileSize: number;
  fileMimeType: string;
  atsScore: number;
  matchScore?: number;
  targetRole?: string;
  parsedContent?: string;
  analysis?: any;
  suggestions?: any[];
  fileUrl?: string;
  createdAt: string;
}

export interface StoredApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  roleCategory: string;
  applicantName: string;
  applicantEmail: string;
  status: "Screening" | "Interview Scheduled" | "Rejected" | "Offer Extended" | "Submitted" | "Offered" | "Closed";
  appliedAt: string;
  coverLetter?: string;
  matchScore?: number;
  notes?: string;
  interviewDate?: string;
}

export function generateId(): string {
  return generateUUID();
}

export function invalidateDbCache(): void {
  // Handled automatically by server db repository
}

// User methods
export async function getUserById(id: string): Promise<User | null> {
  return findUserById(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return findUserByEmail(email);
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  return findUserByPhone(phone);
}

export async function createUser(userData: User): Promise<User> {
  return insertUser(userData);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  return updateUserById(id, updates);
}

export async function deleteUser(id: string): Promise<boolean> {
  return deleteUserById(id);
}

export async function getAllUsers(): Promise<User[]> {
  return listAllUsers();
}

// Session methods
export async function createSession(sessionData: any): Promise<void> {
  const hash = sessionData.refreshToken ? hashToken(sessionData.refreshToken) : "";
  await insertSession({
    ...sessionData,
    refreshTokenHash: hash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}

export async function getSession(id: string): Promise<UserSession | null> {
  return findSessionById(id);
}

export async function getSessionByRefreshToken(token: string): Promise<UserSession | null> {
  const hash = hashToken(token);
  return findSessionByTokenHash(hash);
}

export async function invalidateSession(id: string): Promise<void> {
  await revokeSessionById(id);
}

export async function getActiveSessionsForUser(userId: string): Promise<UserSession[]> {
  return listActiveSessionsByUserId(userId);
}

// Activity methods
export async function logActivity(activityData: Omit<UserActivity, "id" | "timestamp">): Promise<UserActivity> {
  return insertActivity(activityData);
}

export async function getActivitiesForUser(userId: string): Promise<UserActivity[]> {
  return listActivitiesByUserId(userId);
}

export async function getAllActivities(): Promise<UserActivity[]> {
  return listAllActivities();
}

// Interview methods
export async function saveInterviewHistory(data: any): Promise<any> {
  return insertInterview({
    ...data,
    id: data.id || generateUUID(),
    interviewerCount: data.interviewerCount || 1,
    persona: data.persona || "mentor",
    state: "COMPLETED",
    questions: data.questionsAsked || [],
    answers: data.answers || [],
    evaluation: data.feedback || {},
    updatedAt: new Date().toISOString()
  });
}

export async function getInterviewsForUser(userId: string): Promise<any[]> {
  return listInterviewsByUserId(userId);
}

// Resume methods
export async function saveResume(data: any): Promise<any> {
  return insertResume({
    ...data,
    id: data.id || generateUUID(),
    updatedAt: new Date().toISOString()
  });
}

export async function getResumesForUser(userId: string): Promise<any[]> {
  return listResumesByUserId(userId);
}

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  return deleteResumeById(id, userId);
}

// Application methods
export async function saveApplication(data: any): Promise<any> {
  return insertApplication({
    ...data,
    id: data.id || generateUUID(),
    updatedAt: new Date().toISOString()
  });
}

export async function getApplicationsForUser(userId: string): Promise<any[]> {
  return listApplicationsByUserId(userId);
}
