export type InterviewType = 'BEHAVIORAL' | 'TECHNICAL' | 'MIXED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface UserProfileSummary {
  fullName?: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
  targetRoleId?: string;
  targetRoleTitle?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  profile?: UserProfileSummary;
}

export interface Profile {
  id: string;
  fullName?: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
  targetRoleId?: string;
  targetRoleTitle?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
  targetRoleId?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface DashboardResponse {
  readiness?: {
    overallScore: number;
    calculatedAt: string;
  };
  cvScore?: number;
  githubScore?: number;
  skillsScore?: number;
  interviewScore?: number;
  verificationScore?: number;
  skillGapCount: number;
  verifiedSkillsCount: number;
  verifiedRequiredCount?: number;
  requiredSkillsCount?: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  type: string;
  title: string;
  timestamp: string;
}

export interface ReadinessScore {
  overallScore: number;
  breakdown: Record<string, number>;
  calculatedAt: string;
}

export interface ReadinessHistoryPoint {
  overallScore: number;
  calculatedAt: string;
}

export interface CvDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface RecommendationItem {
  text: string;
  justification?: string;
  evidence?: string;
  priority?: 'high' | 'medium' | 'low' | string;
}

export interface CvScoreBreakdown {
  keywordScore: number;
  formatScore: number;
  completenessScore: number;
}

export interface CvAnalysis {
  id: string;
  documentId?: string;
  fileName?: string;
  targetRoleId?: string;
  targetRoleTitle?: string;
  atsScore: number;
  roleFitScore?: number;
  roleFitSummary?: string;
  breakdown: CvScoreBreakdown;
  keywordReport: Record<string, string[]>;
  summaryTips?: string[];
  summaryText?: string;
  reportSummary?: string;
  suggestions: string[];
  recommendations?: RecommendationItem[];
  parsedData: Record<string, unknown>;
  analyzedAt: string;
}

export interface AnalyzeJobResponse {
  analysisId: string;
  jobId: string;
  status: string;
}

export interface JobStatusResponse {
  id: string;
  jobType: string;
  status: JobStatus;
  resultRefId: string;
  errorMessage: string;
}

export interface GitHubConnectionStatus {
  connected: boolean;
  oauthConfigured?: boolean;
  username?: string;
  lastSyncedAt?: string;
}

export interface GitHubAnalysis {
  id: string;
  overallScore: number;
  activityScore: number;
  readmeScore: number;
  diversityScore: number;
  roleAlignmentScore?: number;
  roleAlignmentSummary?: string;
  targetRoleId?: string;
  targetRoleTitle?: string;
  languageStats?: Record<string, number>;
  repoStats?: {
    count?: number;
    stars?: number;
    languages?: number;
    targetRoleTitle?: string;
    roleAlignmentScore?: number;
    roleAlignmentSummary?: string;
  };
  recommendations?: string[];
  summaryTips?: string[];
  summaryText?: string;
  reportSummary?: string;
  recommendationItems?: RecommendationItem[];
  analyzedAt: string;
}

export interface GitHubAnalyzeResponse {
  jobId: string;
  analysisId: string;
  status: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface UserSkill {
  skillId: string;
  skillName: string;
  category: string;
  level: number;
  confidence: number;
  source: string;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  priority: string;
  currentLevel: number;
  requiredLevel: number;
}

export interface SelfAssessmentItem {
  skillId: string;
  level: number;
}

export interface TargetRole {
  id: string;
  title: string;
  industry: string;
  description?: string;
  requiredSkills?: RequiredSkillEntry[];
}

export interface RequiredSkillEntry {
  skillId: string;
  skillName: string;
  weight: number;
  minLevel: number;
}

export interface StartSessionRequest {
  targetRoleId: string;
  type: InterviewType;
  difficulty: Difficulty;
}

export interface InterviewAnswer {
  answerText?: string;
  score?: number;
  feedback?: Record<string, unknown>;
}

export interface InterviewQuestion {
  id: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  answer?: InterviewAnswer;
}

export interface InterviewSession {
  id: string;
  targetRoleId?: string;
  targetRoleTitle?: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  status: string;
  overallScore?: number;
  summaryFeedback?: string;
  startedAt: string;
  completedAt?: string;
  questions: InterviewQuestion[];
}

export interface SubmitAnswerRequest {
  questionId: string;
  answerText: string;
}

export interface RoadmapItem {
  id: string;
  itemType: string;
  title: string;
  description?: string;
  resources?: string | unknown[];
  status: ItemStatus;
  sortOrder: number;
  skillName?: string;
  completedAt?: string;
}

export interface Roadmap {
  id: string;
  title: string;
  status: string;
  generatedAt: string;
  items: RoadmapItem[];
}

export interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options?: string[];
}

export interface StartVerificationResponse {
  verificationId: string;
  questions: QuizQuestion[];
}

export interface VerificationSubmitResponse {
  score: number;
  passed: boolean;
  feedback?: Record<string, unknown>;
}

export interface VerificationHistoryItem {
  id: string;
  skillId: string;
  skillName: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  verifiedAt: string;
}

export interface VerificationBadge {
  skillId: string;
  skillName: string;
  score: number;
  verifiedAt: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
