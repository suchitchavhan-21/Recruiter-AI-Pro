export interface User {
  id: string; // UUID primary key
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
  refreshTokenHash: string;
  isActive: boolean;
  expiresAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  activityName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface InterviewSessionRecord {
  id: string;
  userId: string;
  company: string;
  role: string;
  difficulty: "Entry" | "Mid" | "Senior" | "Expert";
  interviewerCount: number;
  persona: string;
  state: "CREATED" | "PREPARING" | "READY" | "ACTIVE" | "IN_PROGRESS" | "PAUSED" | "EVALUATING" | "COMPLETED" | "CANCELLED" | "ABORTED";
  score: number;
  timeTaken: string;
  questions: Array<{
    id: number;
    text: string;
    type: "technical" | "behavioral";
    expectedFocus?: string;
    topic?: string;
    timeLimitSeconds?: number;
  }>;
  answers: Array<{
    questionId: number;
    questionText: string;
    type: "technical" | "behavioral";
    answerText: string;
    durationSeconds?: number;
    interrupted?: boolean;
    confidenceScore?: number;
  }>;
  evaluation?: {
    overallRating: string;
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    score?: number;
    questionBreakdown?: Array<{
      questionText: string;
      critique: string;
      modelAnswer: string;
      score?: number;
      feedback?: string;
    }>;
    panelFeedback?: Record<string, any>;
    mistakesMade?: string[];
    idealAnswers?: string[];
    hiringRecommendation?: string;
    practicePlan?: string[];
  };
  sessionState?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  resumeName: string;
  fileSize: number;
  fileMimeType: string;
  atsScore: number;
  matchScore?: number;
  targetRole?: string;
  parsedContent?: string;
  analysis?: Record<string, any>;
  suggestions?: Array<Record<string, any>>;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationRecord {
  id: string;
  userId: string;
  company: string;
  role: string;
  roleCategory: string;
  applicantName: string;
  applicantEmail: string;
  status: "Screening" | "Interview Scheduled" | "Rejected" | "Offer Extended" | "Submitted" | "Offered" | "Closed";
  coverLetter?: string;
  matchScore?: number;
  notes?: string;
  interviewDate?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface SavedSTARStoryRecord {
  id: string;
  userId: string;
  role: string;
  company: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  expertStory: string;
  title?: string;
  coachingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface DatabaseState {
  users: User[];
  sessions: UserSession[];
  activities: UserActivity[];
  interviews: InterviewSessionRecord[];
  resumes: ResumeRecord[];
  applications: JobApplicationRecord[];
  starStories: SavedSTARStoryRecord[];
  auditLogs: AdminAuditLog[];
}
