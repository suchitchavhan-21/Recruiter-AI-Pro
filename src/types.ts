export type Phase = 
  | "PHASE1_INPUT" 
  | "PHASE1_SUMMARY" 
  | "PHASE2_INTERVIEW" 
  | "PHASE3_FEEDBACK" 
  | "PHASE4_COACHING";

export interface Question {
  id: number;
  text: string;
  type: "technical" | "behavioral";
  expectedFocus: string;
}

export interface JDAnalysis {
  difficulty: "Entry" | "Mid" | "Senior" | "Expert" | string;
  skills: string[];
  companyTrends: string;
  questions: Question[];
  searchSources?: { title: string; uri: string }[];
}

export interface QAHistory {
  questionId: number;
  questionText: string;
  type: "technical" | "behavioral";
  answerText: string;
}

export interface FeedbackReport {
  overallRating: "Strong Hire" | "Lean Hire" | "No Hire" | string;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  questionBreakdown: {
    questionText: string;
    critique: string;
    modelAnswer: string;
  }[];
}

export interface CoachingData {
  feedback: string;
  modelAnswerSuggestion: string;
}

export type InterviewerPersona = "mentor" | "architect" | "product_leader";

export interface SavedSTARStory {
  id: string;
  timestamp: string;
  role: string;
  company: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  expertStory: string;
}

export interface InterviewSession {
  id: string;
  timestamp: string;
  role: string;
  company: string;
  persona: InterviewerPersona;
  analysis: JDAnalysis;
  answers: QAHistory[];
  evaluation: FeedbackReport;
  score: number; // calculated overall rating score (e.g. 92) for charting
}

export interface JobApplication {
  id: string;
  timestamp: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  roleCategory: string;
  applicantName: string;
  applicantEmail: string;
  selectedStoryId?: string;
  coverLetter: string;
  status: "Submitted" | "Screening" | "Interview Scheduled" | "Offered" | "Closed";
  appliedSlot: string;
  screeningFeedback: string;
  matchScore: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  joinedAt: string;
  avatarEmoji: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string; // "interview_started" | "interview_evaluated" | "star_story_saved" | "job_applied" | "profile_created"
  timestamp: string;
  details: string;
  metadata?: any;
}


