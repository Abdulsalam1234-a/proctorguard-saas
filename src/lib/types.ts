export type Role = 'SUPER_ADMIN' | 'INSTRUCTOR';

export type SubscriptionTier = 'MEMBER' | 'PRO' | 'PREMIUM';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';

export type AttemptStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED_VIOLATION'
  | 'AUTO_SUBMITTED_TIMEOUT'
  | 'AUTO_SUBMITTED_NETWORK';

export type ViolationType =
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'CAMERA_BLOCKED'
  | 'WINDOW_BLUR'
  | 'UNAUTHORIZED_DEVICE'
  | 'LOOKING_AWAY'
  | 'NO_FACE_DETECTED'
  | 'MULTIPLE_FACES'
  | 'ERRATIC_MOTION';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: SubscriptionTier;
  tier?: SubscriptionTier;
  name: string;
  tagline: string;
  badge?: string;
  popular?: boolean;
  priceMonthlyNgn: number;
  priceAnnualNgn: number;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  maxStudents: number;
  maxExamsPerMonth: number; // -1 for unlimited
  storageLimitMb: number;
  features: string[];
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: Role;
  institution: string;
  department: string;
  subscription?: Subscription | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  maxStudents: number;
  maxExamsPerMonth: number;
  storageLimitMb: number;
  currentExamCount: number;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  instructorId: string;
  exams?: Exam[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Exam {
  id: string;
  courseId: string;
  course?: Course;
  title: string;
  accessCode: string;
  durationMinutes: number;
  passMarkPercentage: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  maxTabSwitches: number;
  requireCamera: boolean;
  isPublished: boolean;
  questions?: Question[];
  attempts?: StudentAttempt[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  orderIndex: number;
  prompt: string;
  type: QuestionType;
  options: QuestionOption[] | string[] | null;
  correctAnswers: string[];
  points: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StudentAttempt {
  id: string;
  examId: string;
  exam?: Exam | null;
  studentId: string;
  studentName: string;
  startedAt: string | Date;
  submittedAt?: string | Date | null;
  status: AttemptStatus;
  tabSwitchCount: number;
  score?: number | null;
  totalPoints?: number | null;
  percentage?: number | null;
  answers?: StudentAnswer[];
  violations?: ViolationLog[];
  lastHeartbeat?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect?: boolean | null;
  pointsAwarded?: number | null;
  savedAt: string | Date;
}

export interface ViolationLog {
  id: string;
  attemptId: string;
  type: ViolationType;
  details?: string | null;
  timestamp: string | Date;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actor?: User;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  timestamp: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

export interface StagedQuestion {
  orderIndex: number;
  prompt: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswers: string[];
  points: number;
  rawText?: string;
}

export interface SyncPayload {
  attemptId: string;
  questionId: string;
  selectedAnswer: string | string[];
  clientTimestamp: number;
}

export interface HeartbeatPayload {
  attemptId: string;
  currentQuestionIndex: number;
  isOnline: boolean;
  hasCameraStream: boolean;
  isFullscreen: boolean;
}
