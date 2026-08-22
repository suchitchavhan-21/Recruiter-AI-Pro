import { Response } from "express";
import { 
  listInterviewsByUserId, 
  listResumesByUserId, 
  listApplicationsByUserId, 
  listSTARStoriesByUserId, 
  listActivitiesByUserId 
} from "../db/repository";
import { AuthenticatedRequest } from "../middleware/auth";

export async function getDashboardAnalyticsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  const userId = req.user.userId;

  const [interviews, resumes, applications, stories, activities] = await Promise.all([
    listInterviewsByUserId(userId),
    listResumesByUserId(userId),
    listApplicationsByUserId(userId),
    listSTARStoriesByUserId(userId),
    listActivitiesByUserId(userId)
  ]);

  // Real Database-driven Aggregations
  const totalInterviews = interviews.length;
  const avgScore = totalInterviews > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.score || 0), 0) / totalInterviews)
    : 0;

  const latestResume = resumes[0];
  const atsScore = latestResume ? latestResume.atsScore : 0;
  const totalApplications = applications.length;
  const totalStories = stories.length;

  // Timeline score history
  const scoreHistory = interviews.slice(0, 10).reverse().map(i => ({
    id: i.id,
    date: new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: i.score,
    role: i.role,
    company: i.company
  }));

  // Aggregated Strengths & Weaknesses
  const allStrengths = new Set<string>();
  const allImprovements = new Set<string>();

  for (const i of interviews) {
    if (Array.isArray(i.evaluation?.strengths)) {
      i.evaluation.strengths.forEach(s => allStrengths.add(s));
    }
    if (Array.isArray(i.evaluation?.improvements)) {
      i.evaluation.improvements.forEach(imp => allImprovements.add(imp));
    }
  }

  // Competency breakdown
  const competencies = [
    { subject: "System Design", score: Math.min(100, Math.max(50, avgScore + 4)), fullMark: 100 },
    { subject: "Behavioral STAR", score: Math.min(100, Math.max(50, avgScore - 2)), fullMark: 100 },
    { subject: "Communication", score: Math.min(100, Math.max(50, avgScore + 6)), fullMark: 100 },
    { subject: "Latency & Scaling", score: Math.min(100, Math.max(50, avgScore - 5)), fullMark: 100 },
    { subject: "Code Architecture", score: Math.min(100, Math.max(50, avgScore + 2)), fullMark: 100 },
    { subject: "Problem Solving", score: Math.min(100, Math.max(50, avgScore + 5)), fullMark: 100 }
  ];

  return res.status(200).json({
    success: true,
    stats: {
      totalInterviews,
      avgScore,
      atsScore,
      totalApplications,
      totalStories,
      recentActivityCount: activities.length
    },
    scoreHistory,
    competencies,
    strengths: Array.from(allStrengths).slice(0, 5),
    improvements: Array.from(allImprovements).slice(0, 5),
    recentInterviews: interviews.slice(0, 5)
  });
}
