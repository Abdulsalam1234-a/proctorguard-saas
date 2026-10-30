import prisma from './prisma';
import {
  User,
  Subscription,
  Course,
  Exam,
  Question,
  StudentAttempt,
  StudentAnswer,
  ViolationLog,
  AuditLog,
  Notification,
  Role,
  SubscriptionTier,
  SubscriptionStatus,
  AttemptStatus,
  ViolationType,
  QuestionType,
} from './types';

// In-Memory & File Store fallback for zero-dependency instant testing
interface MockDatabaseState {
  users: User[];
  subscriptions: Subscription[];
  courses: Course[];
  exams: Exam[];
  questions: Question[];
  attempts: StudentAttempt[];
  answers: StudentAnswer[];
  violations: ViolationLog[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

let mockState: MockDatabaseState | null = null;
let usePrisma = true;

// Pre-seeded initial data for Nigerian Universities context
function initializeSeedData(): MockDatabaseState {
  const adminId = 'super-admin-01';
  const instructor1Id = 'inst-adewale-01';
  const instructor2Id = 'inst-ibrahim-02';

  const users: User[] = [
    {
      id: adminId,
      email: 'admin@proctorguard.edu.ng',
      // Hash for 'Admin@2026!'
      passwordHash: '$2a$10$wU05e7m.qF9x1aX/B3jZuee35l9kZtwkKzUaU557jQ/bQW6R1i47y',
      name: 'Engr. Mustapha Bello (NUC Admin)',
      role: 'SUPER_ADMIN',
      institution: 'National Universities Commission (NUC)',
      department: 'ICT & Academic Accreditation Board',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: instructor1Id,
      email: 'dradewale@unilag.edu.ng',
      passwordHash: '$2a$10$wU05e7m.qF9x1aX/B3jZuee35l9kZtwkKzUaU557jQ/bQW6R1i47y',
      name: 'Dr. Folashade Adewale',
      role: 'INSTRUCTOR',
      institution: 'University of Lagos (UNILAG)',
      department: 'Banking & Commercial Law',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
    },
    {
      id: instructor2Id,
      email: 'profibrahim@abu.edu.ng',
      passwordHash: '$2a$10$wU05e7m.qF9x1aX/B3jZuee35l9kZtwkKzUaU557jQ/bQW6R1i47y',
      name: 'Prof. Abubakar Ibrahim',
      role: 'INSTRUCTOR',
      institution: 'Ahmadu Bello University (ABU Zaria)',
      department: 'Computer Science & Software Engineering',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub-01',
      userId: instructor1Id,
      tier: 'PRO',
      status: 'ACTIVE',
      maxStudents: 300,
      maxExamsPerMonth: 25,
      storageLimitMb: 1000,
      currentExamCount: 3,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
    },
    {
      id: 'sub-02',
      userId: instructor2Id,
      tier: 'PREMIUM',
      status: 'ACTIVE',
      maxStudents: 1000,
      maxExamsPerMonth: 100,
      storageLimitMb: 5000,
      currentExamCount: 5,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    },
  ];

  const courses: Course[] = [
    {
      id: 'course-law-301',
      code: 'LAW301',
      title: 'Nigerian Commercial & Corporate Law II',
      instructorId: instructor1Id,
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
    },
    {
      id: 'course-fin-301',
      code: 'FIN301',
      title: 'Financial Institutions & Capital Markets in Nigeria',
      instructorId: instructor1Id,
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date('2026-02-05'),
    },
    {
      id: 'course-csc-201',
      code: 'CSC201',
      title: 'Data Structures & Algorithms in Low-Bandwidth Systems',
      instructorId: instructor2Id,
      createdAt: new Date('2026-02-10'),
      updatedAt: new Date('2026-02-10'),
    },
  ];

  const exams: Exam[] = [
    {
      id: 'exam-law-test-1',
      courseId: 'course-law-301',
      title: 'Mid-Semester CBT Assessment: Company Formation & CAMA 2020',
      accessCode: 'LAW301-2026',
      durationMinutes: 45,
      passMarkPercentage: 50.0,
      randomizeQuestions: true,
      randomizeOptions: true,
      maxTabSwitches: 3,
      requireCamera: true,
      isPublished: true,
      createdAt: new Date('2026-02-15'),
      updatedAt: new Date('2026-02-15'),
    },
    {
      id: 'exam-fin-test-1',
      courseId: 'course-fin-301',
      title: 'Continuous Assessment Test 1: CBN Monetary Policy & Banking Regulations',
      accessCode: 'FIN301-EXAM',
      durationMinutes: 30,
      passMarkPercentage: 60.0,
      randomizeQuestions: false,
      randomizeOptions: true,
      maxTabSwitches: 2,
      requireCamera: true,
      isPublished: true,
      createdAt: new Date('2026-02-18'),
      updatedAt: new Date('2026-02-18'),
    },
    {
      id: 'exam-csc-test-1',
      courseId: 'course-csc-201',
      title: 'Practical Coding Theory & Computational Asymptotics',
      accessCode: 'CSC201-TEST',
      durationMinutes: 60,
      passMarkPercentage: 50.0,
      randomizeQuestions: true,
      randomizeOptions: false,
      maxTabSwitches: 3,
      requireCamera: true,
      isPublished: true,
      createdAt: new Date('2026-02-20'),
      updatedAt: new Date('2026-02-20'),
    },
  ];

  const questions: Question[] = [
    {
      id: 'q-law-1',
      examId: 'exam-law-test-1',
      orderIndex: 1,
      prompt: 'Under Section 18 of the Companies and Allied Matters Act (CAMA) 2020, what is the minimum number of persons required to form a private company in Nigeria?',
      type: 'SINGLE_CHOICE',
      options: [
        { id: 'A', text: 'Two persons' },
        { id: 'B', text: 'One person' },
        { id: 'C', text: 'Seven persons' },
        { id: 'D', text: 'Fifty persons' },
      ],
      correctAnswers: ['B'],
      points: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q-law-2',
      examId: 'exam-law-test-1',
      orderIndex: 2,
      prompt: 'Which statutory regulatory body is vested with the constitutional and statutory power to register corporate entities in Nigeria?',
      type: 'SINGLE_CHOICE',
      options: [
        { id: 'A', text: 'Securities and Exchange Commission (SEC)' },
        { id: 'B', text: 'Central Bank of Nigeria (CBN)' },
        { id: 'C', text: 'Corporate Affairs Commission (CAC)' },
        { id: 'D', text: 'Federal Inland Revenue Service (FIRS)' },
      ],
      correctAnswers: ['C'],
      points: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q-law-3',
      examId: 'exam-law-test-1',
      orderIndex: 3,
      prompt: 'Select ALL elements required to constitute a valid legally binding contract under Nigerian common law doctrine.',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'A', text: 'Offer' },
        { id: 'B', text: 'Unconditional Acceptance' },
        { id: 'C', text: 'Valuable Consideration' },
        { id: 'D', text: 'Intention to create legal relations' },
        { id: 'E', text: 'Payment of physical cash upfront' },
      ],
      correctAnswers: ['A', 'B', 'C', 'D'],
      points: 4.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q-law-4',
      examId: 'exam-law-test-1',
      orderIndex: 4,
      prompt: 'What Latin legal maxim establishes the fundamental rule of corporate separate legal personality as laid down in Salomon v Salomon & Co Ltd?',
      type: 'SHORT_ANSWER',
      options: [],
      correctAnswers: ['persona ficta', 'corporate veil', 'separate legal personality'],
      points: 3.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q-law-5',
      examId: 'exam-law-test-1',
      orderIndex: 5,
      prompt: 'An ultra vires contract executed by company directors in contravention of the company objects clause is treated under modern Nigerian CAMA 2020 as:',
      type: 'SINGLE_CHOICE',
      options: [
        { id: 'A', text: 'Automatically criminalized and directors jailed immediately' },
        { id: 'B', text: 'Not invalid solely on the ground of lack of capacity' },
        { id: 'C', text: 'Completely unenforceable under any circumstances' },
        { id: 'D', text: 'Transferred to the federal high court for dissolution' },
      ],
      correctAnswers: ['B'],
      points: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // FIN301 Questions
    {
      id: 'q-fin-1',
      examId: 'exam-fin-test-1',
      orderIndex: 1,
      prompt: 'The Monetary Policy Committee (MPC) of the Central Bank of Nigeria primarily sets which benchmark interest rate to control domestic inflation?',
      type: 'SINGLE_CHOICE',
      options: [
        { id: 'A', text: 'Cash Reserve Ratio (CRR)' },
        { id: 'B', text: 'Monetary Policy Rate (MPR)' },
        { id: 'C', text: 'Liquidity Ratio (LR)' },
        { id: 'D', text: 'Treasury Bill Discount Rate' },
      ],
      correctAnswers: ['B'],
      points: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'q-fin-2',
      examId: 'exam-fin-test-1',
      orderIndex: 2,
      prompt: 'Identify the principal securities exchange market in Nigeria where equities, bonds, and exchange-traded products are publicly traded.',
      type: 'SINGLE_CHOICE',
      options: [
        { id: 'A', text: 'Nigerian Exchange Group (NGX)' },
        { id: 'B', text: 'FMDQ Securities Exchange' },
        { id: 'C', text: 'NASD OTC Securities' },
        { id: 'D', text: 'Lagos Commodities and Futures Exchange' },
      ],
      correctAnswers: ['A'],
      points: 2.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Sample student attempts showcasing various statuses
  const attempts: StudentAttempt[] = [
    {
      id: 'att-01',
      examId: 'exam-law-test-1',
      studentId: 'LAW/2022/104',
      studentName: 'Chinedu Okonkwo',
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      submittedAt: new Date(Date.now() - 5 * 60 * 1000),
      status: 'SUBMITTED',
      tabSwitchCount: 1,
      score: 11.0,
      totalPoints: 13.0,
      percentage: 84.6,
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      lastHeartbeat: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: 'att-02',
      examId: 'exam-law-test-1',
      studentId: 'LAW/2022/089',
      studentName: 'Amina Zainab Bello',
      startedAt: new Date(Date.now() - 25 * 60 * 1000),
      submittedAt: new Date(Date.now() - 10 * 60 * 1000),
      status: 'AUTO_SUBMITTED_VIOLATION',
      tabSwitchCount: 4,
      score: 4.0,
      totalPoints: 13.0,
      percentage: 30.77,
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000),
      lastHeartbeat: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: 'att-03',
      examId: 'exam-law-test-1',
      studentId: 'LAW/2022/210',
      studentName: 'Oluwaseun Adeleke',
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      submittedAt: null,
      status: 'IN_PROGRESS',
      tabSwitchCount: 2,
      score: null,
      totalPoints: 13.0,
      percentage: null,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      updatedAt: new Date(),
      lastHeartbeat: new Date(),
    },
  ];

  const answers: StudentAnswer[] = [
    {
      id: 'ans-1',
      attemptId: 'att-01',
      questionId: 'q-law-1',
      selectedAnswer: 'B',
      isCorrect: true,
      pointsAwarded: 2.0,
      savedAt: new Date(Date.now() - 35 * 60 * 1000),
    },
    {
      id: 'ans-2',
      attemptId: 'att-01',
      questionId: 'q-law-2',
      selectedAnswer: 'C',
      isCorrect: true,
      pointsAwarded: 2.0,
      savedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: 'ans-3',
      attemptId: 'att-01',
      questionId: 'q-law-3',
      selectedAnswer: ['A', 'B', 'C', 'D'],
      isCorrect: true,
      pointsAwarded: 4.0,
      savedAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: 'ans-4',
      attemptId: 'att-01',
      questionId: 'q-law-4',
      selectedAnswer: 'corporate veil',
      isCorrect: true,
      pointsAwarded: 3.0,
      savedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: 'ans-5',
      attemptId: 'att-01',
      questionId: 'q-law-5',
      selectedAnswer: 'C',
      isCorrect: false,
      pointsAwarded: 0.0,
      savedAt: new Date(Date.now() - 8 * 60 * 1000),
    },
  ];

  const violations: ViolationLog[] = [
    {
      id: 'v-01',
      attemptId: 'att-01',
      type: 'TAB_SWITCH',
      details: 'Lost window focus via window.onblur. Total switches: 1',
      timestamp: new Date(Date.now() - 28 * 60 * 1000),
    },
    {
      id: 'v-02',
      attemptId: 'att-02',
      type: 'TAB_SWITCH',
      details: 'Switched tabs to search external materials. Switch 1/3',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: 'v-03',
      attemptId: 'att-02',
      type: 'TAB_SWITCH',
      details: 'Switched tabs to WhatsApp desktop. Switch 2/3',
      timestamp: new Date(Date.now() - 16 * 60 * 1000),
    },
    {
      id: 'v-04',
      attemptId: 'att-02',
      type: 'FULLSCREEN_EXIT',
      details: 'Candidate pressed ESC to exit locked fullscreen window',
      timestamp: new Date(Date.now() - 14 * 60 * 1000),
    },
    {
      id: 'v-05',
      attemptId: 'att-02',
      type: 'TAB_SWITCH',
      details: 'Switched tabs again. Limit exceeded (4/3). Session terminated automatically.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: 'v-06',
      attemptId: 'att-03',
      type: 'CAMERA_BLOCKED',
      details: 'Webcam feed dropped or light covered momentarily',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
    },
    {
      id: 'v-07',
      attemptId: 'att-03',
      type: 'TAB_SWITCH',
      details: 'Lost window focus via document.visibilityState === hidden',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-01',
      actorId: adminId,
      action: 'TENANT_TIER_UPGRADE',
      targetId: instructor1Id,
      metadata: { previousTier: 'MEMBER', updatedTier: 'PRO', reason: 'Official UNILAG Law Faculty subscription approval' },
      timestamp: new Date('2026-02-01'),
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-01',
      userId: instructor1Id,
      title: 'Subscription Tier Upgraded',
      message: 'Super Admin has approved your faculty upgrade to PRO Tier (300 active candidates, 25 CBT exams/month).',
      read: false,
      createdAt: new Date('2026-02-01'),
    },
  ];

  return {
    users,
    subscriptions,
    courses,
    exams,
    questions,
    attempts,
    answers,
    violations,
    auditLogs,
    notifications,
  };
}

export function getMockStore(): MockDatabaseState {
  if (!mockState) {
    mockState = initializeSeedData();
  }
  return mockState;
}

// Check Prisma connectivity once
async function testPrismaConnection(): Promise<boolean> {
  if (!usePrisma) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.warn('[DB Service] PostgreSQL not reachable via Prisma; falling back to high-resilience in-memory store.');
    usePrisma = false;
    return false;
  }
}

/**
 * Enterprise Database Service Layer with strict relational integrity,
 * transaction safety, and transparent fallback
 */
export const dbService = {
  // ===================== USER & AUTH =====================
  async findUserByEmail(email: string): Promise<User | null> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.user.findUnique({
        where: { email },
        include: { subscription: true },
      })) as any;
    }
    const store = getMockStore();
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const sub = store.subscriptions.find((s) => s.userId === user.id);
    return { ...user, subscription: sub };
  },

  async findUserById(id: string): Promise<User | null> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.user.findUnique({
        where: { id },
        include: { subscription: true },
      })) as any;
    }
    const store = getMockStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return null;
    const sub = store.subscriptions.find((s) => s.userId === user.id);
    return { ...user, subscription: sub };
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    role?: Role;
    institution: string;
    department: string;
    tier?: SubscriptionTier;
  }): Promise<User> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name,
            role: data.role || 'INSTRUCTOR',
            institution: data.institution,
            department: data.department,
          },
        });

        await tx.subscription.create({
          data: {
            userId: user.id,
            tier: data.tier || 'MEMBER',
            status: 'ACTIVE',
            maxStudents: data.tier === 'PREMIUM' ? 1000 : data.tier === 'PRO' ? 300 : 50,
            maxExamsPerMonth: data.tier === 'PREMIUM' ? 100 : data.tier === 'PRO' ? 25 : 5,
            storageLimitMb: data.tier === 'PREMIUM' ? 5000 : data.tier === 'PRO' ? 1000 : 250,
          },
        });

        return tx.user.findUnique({
          where: { id: user.id },
          include: { subscription: true },
        });
      })) as any;
    }

    const store = getMockStore();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role || 'INSTRUCTOR',
      institution: data.institution,
      department: data.department,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.users.push(newUser);

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      userId: newUser.id,
      tier: data.tier || 'MEMBER',
      status: 'ACTIVE',
      maxStudents: data.tier === 'PREMIUM' ? 1000 : data.tier === 'PRO' ? 300 : 50,
      maxExamsPerMonth: data.tier === 'PREMIUM' ? 100 : data.tier === 'PRO' ? 25 : 5,
      storageLimitMb: data.tier === 'PREMIUM' ? 5000 : data.tier === 'PRO' ? 1000 : 250,
      currentExamCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.subscriptions.push(newSub);

    return { ...newUser, subscription: newSub };
  },

  // ===================== SUPER ADMIN TENANT OVERSIGHT =====================
  async getAllTenants(): Promise<any[]> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        include: {
          subscription: true,
          courses: {
            include: {
              exams: {
                include: {
                  attempts: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })) as any;
    }

    const store = getMockStore();
    return store.users
      .filter((u) => u.role === 'INSTRUCTOR')
      .map((instructor) => {
        const sub = store.subscriptions.find((s) => s.userId === instructor.id);
        const courses = store.courses
          .filter((c) => c.instructorId === instructor.id)
          .map((c) => {
            const exams = store.exams
              .filter((e) => e.courseId === c.id)
              .map((e) => {
                const attempts = store.attempts.filter((a) => a.examId === e.id);
                return { ...e, attempts };
              });
            return { ...c, exams };
          });

        return {
          ...instructor,
          subscription: sub,
          courses,
        };
      });
  },

  async updateTenantSubscription(
    adminUserId: string,
    instructorId: string,
    params: {
      tier?: SubscriptionTier;
      status?: SubscriptionStatus;
      maxStudents?: number;
      maxExamsPerMonth?: number;
      storageLimitMb?: number;
      reason?: string;
    }
  ): Promise<Subscription> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return await prisma.$transaction(async (tx) => {
        let subRecord = await tx.subscription.findUnique({ where: { userId: instructorId } });
        if (!subRecord) {
          subRecord = await tx.subscription.findUnique({ where: { id: instructorId } });
        }
        if (!subRecord) throw new Error('Subscription not found');

        const prev = { ...subRecord };
        const dataToUpdate: any = {};
        if (params.tier) dataToUpdate.tier = params.tier;
        if (params.status) dataToUpdate.status = params.status;
        if (params.maxStudents !== undefined && !isNaN(params.maxStudents)) dataToUpdate.maxStudents = params.maxStudents;
        if (params.maxExamsPerMonth !== undefined && !isNaN(params.maxExamsPerMonth)) dataToUpdate.maxExamsPerMonth = params.maxExamsPerMonth;
        if (params.storageLimitMb !== undefined && !isNaN(params.storageLimitMb)) dataToUpdate.storageLimitMb = params.storageLimitMb;

        const updated = await tx.subscription.update({
          where: { id: subRecord.id },
          data: dataToUpdate,
        });

        // Audit Trail
        await tx.auditLog.create({
          data: {
            actorId: adminUserId,
            action: 'SUPER_ADMIN_UPDATE_SUBSCRIPTION',
            targetId: subRecord.userId,
            metadata: {
              previous: prev,
              updated,
              reason: params.reason || 'Admin administrative quota adjustment',
            },
          },
        });

        // In-app alert to affected instructor
        await tx.notification.create({
          data: {
            userId: subRecord.userId,
            title: 'Account Quota Updated by Super Admin',
            message: `Your subscription tier was set to ${params.tier || subRecord.tier} (${params.status || subRecord.status}). Active candidate quota: ${params.maxStudents || subRecord.maxStudents}.`,
          },
        });

        return updated;
      });
    }

    const store = getMockStore();
    const sub = store.subscriptions.find((s) => s.userId === instructorId || s.id === instructorId);
    if (!sub) throw new Error('Subscription not found');

    const previous = { ...sub };
    if (params.tier) sub.tier = params.tier;
    if (params.status) sub.status = params.status;
    if (params.maxStudents !== undefined && !isNaN(params.maxStudents)) sub.maxStudents = params.maxStudents;
    if (params.maxExamsPerMonth !== undefined && !isNaN(params.maxExamsPerMonth)) sub.maxExamsPerMonth = params.maxExamsPerMonth;
    if (params.storageLimitMb !== undefined && !isNaN(params.storageLimitMb)) sub.storageLimitMb = params.storageLimitMb;
    sub.updatedAt = new Date();

    // Record Audit
    store.auditLogs.push({
      id: `aud-${Date.now()}`,
      actorId: adminUserId,
      action: 'SUPER_ADMIN_UPDATE_SUBSCRIPTION',
      targetId: instructorId,
      metadata: { previous, updated: sub, reason: params.reason || 'Admin administrative quota adjustment' },
      timestamp: new Date(),
    });

    // In-app alert
    store.notifications.push({
      id: `notif-${Date.now()}`,
      userId: instructorId,
      title: 'Account Quota Updated by Super Admin',
      message: `Your subscription tier was set to ${params.tier} (${params.status}). Active candidate quota: ${params.maxStudents}, Exams limit: ${params.maxExamsPerMonth}/month.`,
      read: false,
      createdAt: new Date(),
    });

    return sub;
  },

  async superAdminOverrideScore(
    adminUserId: string,
    attemptId: string,
    newScore: number,
    reason: string
  ): Promise<StudentAttempt> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return await prisma.$transaction(async (tx) => {
        const attempt = await tx.studentAttempt.findUnique({
          where: { id: attemptId },
          include: { exam: { include: { course: true } } },
        });
        if (!attempt) throw new Error('Attempt not found');

        const prevScore = attempt.score;
        const total = attempt.totalPoints || 100;
        const percentage = Number(((newScore / total) * 100).toFixed(2));

        const updated = await tx.studentAttempt.update({
          where: { id: attemptId },
          data: {
            score: newScore,
            percentage,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            actorId: adminUserId,
            action: 'SUPER_ADMIN_OVERRIDE_SCORE',
            targetId: attemptId,
            metadata: {
              studentId: attempt.studentId,
              studentName: attempt.studentName,
              examTitle: attempt.exam.title,
              previousScore: prevScore,
              updatedScore: newScore,
              percentage,
              reason,
            },
          },
        });

        // Alert instructor
        await tx.notification.create({
          data: {
            userId: attempt.exam.course.instructorId,
            title: `Score Override on ${attempt.exam.title}`,
            message: `Super Admin manually modified score for candidate ${attempt.studentName} (${attempt.studentId}) from ${prevScore} to ${newScore} points. Reason: ${reason}`,
          },
        });

        return updated as any;
      });
    }

    const store = getMockStore();
    const attempt = store.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    const exam = store.exams.find((e) => e.id === attempt.examId);
    const course = exam ? store.courses.find((c) => c.id === exam.courseId) : null;

    const prevScore = attempt.score;
    const total = attempt.totalPoints || 100;
    const percentage = Number(((newScore / total) * 100).toFixed(2));

    attempt.score = newScore;
    attempt.percentage = percentage;
    attempt.updatedAt = new Date();

    // Audit log
    store.auditLogs.push({
      id: `aud-${Date.now()}`,
      actorId: adminUserId,
      action: 'SUPER_ADMIN_OVERRIDE_SCORE',
      targetId: attemptId,
      metadata: {
        studentId: attempt.studentId,
        studentName: attempt.studentName,
        examTitle: exam?.title,
        previousScore: prevScore,
        updatedScore: newScore,
        percentage,
        reason,
      },
      timestamp: new Date(),
    });

    if (course?.instructorId) {
      store.notifications.push({
        id: `notif-${Date.now()}`,
        userId: course.instructorId,
        title: `Score Override on ${exam?.title}`,
        message: `Super Admin manually modified score for candidate ${attempt.studentName} (${attempt.studentId}) from ${prevScore} to ${newScore} points. Reason: ${reason}`,
        read: false,
        createdAt: new Date(),
      });
    }

    return attempt;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.auditLog.findMany({
        include: { actor: true },
        orderBy: { timestamp: 'desc' },
      })) as any;
    }
    const store = getMockStore();
    return store.auditLogs.map((log) => {
      const actor = store.users.find((u) => u.id === log.actorId);
      return { ...log, actor };
    });
  },

  async getInstructorNotifications(instructorId: string): Promise<Notification[]> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.notification.findMany({
        where: { userId: instructorId },
        orderBy: { createdAt: 'desc' },
      })) as any;
    }
    const store = getMockStore();
    return store.notifications.filter((n) => n.userId === instructorId);
  },

  // ===================== COURSES =====================
  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.course.findMany({
        where: { instructorId },
        include: { exams: true },
        orderBy: { createdAt: 'desc' },
      })) as any;
    }
    const store = getMockStore();
    return store.courses
      .filter((c) => c.instructorId === instructorId)
      .map((c) => ({
        ...c,
        exams: store.exams.filter((e) => e.courseId === c.id),
      }));
  },

  async createCourse(data: { code: string; title: string; instructorId: string }): Promise<Course> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.course.create({
        data,
      })) as any;
    }
    const store = getMockStore();
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: data.code.toUpperCase(),
      title: data.title,
      instructorId: data.instructorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.courses.push(newCourse);
    return newCourse;
  },

  async deleteCourse(courseId: string, instructorId: string): Promise<boolean> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      await prisma.course.delete({
        where: { id: courseId },
      });
      return true;
    }
    const store = getMockStore();
    const idx = store.courses.findIndex((c) => c.id === courseId && c.instructorId === instructorId);
    if (idx !== -1) {
      store.courses.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ===================== EXAMS =====================
  async getExamsByInstructor(instructorId: string): Promise<Exam[]> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.exam.findMany({
        where: { course: { instructorId } },
        include: {
          course: true,
          questions: true,
          attempts: true,
        },
        orderBy: { createdAt: 'desc' },
      })) as any;
    }
    const store = getMockStore();
    const courses = store.courses.filter((c) => c.instructorId === instructorId);
    const courseIds = courses.map((c) => c.id);

    return store.exams
      .filter((e) => courseIds.includes(e.courseId))
      .map((e) => ({
        ...e,
        course: courses.find((c) => c.id === e.courseId),
        questions: store.questions.filter((q) => q.examId === e.id),
        attempts: store.attempts.filter((a) => a.examId === e.id),
      }));
  },

  async getExamById(examId: string): Promise<Exam | null> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          course: true,
          questions: { orderBy: { orderIndex: 'asc' } },
          attempts: {
            include: {
              answers: true,
              violations: true,
            },
          },
        },
      })) as any;
    }
    const store = getMockStore();
    const exam = store.exams.find((e) => e.id === examId);
    if (!exam) return null;
    const course = store.courses.find((c) => c.id === exam.courseId);
    const questions = store.questions
      .filter((q) => q.examId === exam.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const attempts = store.attempts
      .filter((a) => a.examId === exam.id)
      .map((att) => ({
        ...att,
        answers: store.answers.filter((ans) => ans.attemptId === att.id),
        violations: store.violations.filter((v) => v.attemptId === att.id),
      }));

    return { ...exam, course, questions, attempts };
  },

  async getExamByAccessCode(accessCode: string): Promise<Exam | null> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.exam.findUnique({
        where: { accessCode: accessCode.trim().toUpperCase() },
        include: {
          course: true,
          questions: { orderBy: { orderIndex: 'asc' } },
        },
      })) as any;
    }
    const store = getMockStore();
    const exam = store.exams.find((e) => e.accessCode.toUpperCase() === accessCode.trim().toUpperCase());
    if (!exam) return null;
    const course = store.courses.find((c) => c.id === exam.courseId);
    const questions = store.questions
      .filter((q) => q.examId === exam.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return { ...exam, course, questions };
  },

  async createExam(data: {
    courseId: string;
    title: string;
    accessCode: string;
    durationMinutes: number;
    passMarkPercentage?: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    maxTabSwitches?: number;
    requireCamera?: boolean;
    isPublished?: boolean;
  }): Promise<Exam> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.exam.create({
        data: {
          ...data,
          accessCode: data.accessCode.trim().toUpperCase(),
        },
        include: { course: true },
      })) as any;
    }
    const store = getMockStore();
    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      courseId: data.courseId,
      title: data.title,
      accessCode: data.accessCode.trim().toUpperCase(),
      durationMinutes: data.durationMinutes,
      passMarkPercentage: data.passMarkPercentage ?? 50.0,
      randomizeQuestions: data.randomizeQuestions ?? false,
      randomizeOptions: data.randomizeOptions ?? false,
      maxTabSwitches: data.maxTabSwitches ?? 3,
      requireCamera: data.requireCamera ?? true,
      isPublished: data.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.exams.push(newExam);
    return newExam;
  },

  async updateExam(examId: string, data: Partial<Exam>): Promise<Exam> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      const { id, course, questions, attempts, createdAt, updatedAt, ...updateData } = data;
      return (await prisma.exam.update({
        where: { id: examId },
        data: {
          ...updateData,
          accessCode: updateData.accessCode ? updateData.accessCode.trim().toUpperCase() : undefined,
        } as any,
        include: { course: true, questions: true },
      })) as any;
    }
    const store = getMockStore();
    const exam = store.exams.find((e) => e.id === examId);
    if (!exam) throw new Error('Exam not found');
    Object.assign(exam, data, {
      accessCode: data.accessCode ? data.accessCode.trim().toUpperCase() : exam.accessCode,
      updatedAt: new Date(),
    });
    return exam;
  },

  async cloneExam(examId: string, instructorId: string): Promise<Exam> {
    const original = await this.getExamById(examId);
    if (!original) throw new Error('Exam not found');

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newAccessCode = `${original.accessCode}-COPY-${randomSuffix}`;

    const newExam = await this.createExam({
      courseId: original.courseId,
      title: `${original.title} (Clone)`,
      accessCode: newAccessCode,
      durationMinutes: original.durationMinutes,
      passMarkPercentage: original.passMarkPercentage,
      randomizeQuestions: original.randomizeQuestions,
      randomizeOptions: original.randomizeOptions,
      maxTabSwitches: original.maxTabSwitches,
      requireCamera: original.requireCamera,
      isPublished: false,
    });

    // Clone questions
    if (original.questions && original.questions.length > 0) {
      for (const q of original.questions) {
        await this.createQuestion({
          examId: newExam.id,
          orderIndex: q.orderIndex,
          prompt: q.prompt,
          type: q.type,
          options: q.options as any,
          correctAnswers: q.correctAnswers,
          points: q.points,
        });
      }
    }

    return (await this.getExamById(newExam.id))!;
  },

  async deleteExam(examId: string): Promise<boolean> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      await prisma.exam.delete({ where: { id: examId } });
      return true;
    }
    const store = getMockStore();
    const idx = store.exams.findIndex((e) => e.id === examId);
    if (idx !== -1) {
      store.exams.splice(idx, 1);
      // Remove child questions and attempts
      store.questions = store.questions.filter((q) => q.examId !== examId);
      store.attempts = store.attempts.filter((a) => a.examId !== examId);
      return true;
    }
    return false;
  },

  // ===================== QUESTIONS =====================
  async createQuestion(data: {
    examId: string;
    orderIndex: number;
    prompt: string;
    type: QuestionType;
    options: any;
    correctAnswers: string[];
    points: number;
  }): Promise<Question> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.question.create({
        data,
      })) as any;
    }
    const store = getMockStore();
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examId: data.examId,
      orderIndex: data.orderIndex,
      prompt: data.prompt,
      type: data.type,
      options: data.options,
      correctAnswers: data.correctAnswers,
      points: data.points,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.questions.push(newQ);
    return newQ;
  },

  async updateQuestion(questionId: string, data: Partial<Question>): Promise<Question> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      const { id, exam, answers, createdAt, updatedAt, ...updateData } = data as any;
      return (await prisma.question.update({
        where: { id: questionId },
        data: updateData,
      })) as any;
    }
    const store = getMockStore();
    const q = store.questions.find((item) => item.id === questionId);
    if (!q) throw new Error('Question not found');
    Object.assign(q, data, { updatedAt: new Date() });
    return q;
  },

  async deleteQuestion(questionId: string): Promise<boolean> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      await prisma.question.delete({ where: { id: questionId } });
      return true;
    }
    const store = getMockStore();
    const idx = store.questions.findIndex((q) => q.id === questionId);
    if (idx !== -1) {
      store.questions.splice(idx, 1);
      return true;
    }
    return false;
  },

  async bulkCreateQuestions(examId: string, questions: any[]): Promise<Question[]> {
    const created: Question[] = [];
    for (const q of questions) {
      const saved = await this.createQuestion({
        examId,
        orderIndex: q.orderIndex,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        correctAnswers: q.correctAnswers,
        points: q.points || 1.0,
      });
      created.push(saved);
    }
    return created;
  },

  // ===================== STUDENT ATTEMPTS & PROCTORING =====================
  async getAttempt(examId: string, studentId: string): Promise<StudentAttempt | null> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.studentAttempt.findUnique({
        where: { examId_studentId: { examId, studentId: studentId.trim().toUpperCase() } },
        include: {
          answers: true,
          violations: true,
          exam: { include: { questions: true } },
        },
      })) as any;
    }
    const store = getMockStore();
    const normalized = studentId.trim().toUpperCase();
    const att = store.attempts.find((a) => a.examId === examId && a.studentId.toUpperCase() === normalized);
    if (!att) return null;
    const answers = store.answers.filter((ans) => ans.attemptId === att.id);
    const violations = store.violations.filter((v) => v.attemptId === att.id);
    const exam = store.exams.find((e) => e.id === att.examId);
    return { ...att, answers, violations, exam };
  },

  async getAttemptById(attemptId: string): Promise<StudentAttempt | null> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.studentAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: true,
          violations: true,
          exam: { include: { questions: true } },
        },
      })) as any;
    }
    const store = getMockStore();
    const att = store.attempts.find((a) => a.id === attemptId);
    if (!att) return null;
    const answers = store.answers.filter((ans) => ans.attemptId === att.id);
    const violations = store.violations.filter((v) => v.attemptId === att.id);
    const exam = store.exams.find((e) => e.id === att.examId);
    return { ...att, answers, violations, exam };
  },

  async startOrResumeAttempt(
    examId: string,
    studentId: string,
    studentName: string
  ): Promise<{ attempt: StudentAttempt; isNew: boolean }> {
    const normalizedId = studentId.trim().toUpperCase();
    const existing = await this.getAttempt(examId, normalizedId);

    if (existing) {
      // If already submitted or locked by violation, cannot re-enter unless unlocked
      return { attempt: existing, isNew: false };
    }

    // Calculate total points from exam questions
    const exam = await this.getExamById(examId);
    const totalPoints = exam?.questions?.reduce((sum, q) => sum + (q.points || 1.0), 0) || 0;

    const isPg = await testPrismaConnection();
    if (isPg) {
      const created = await prisma.studentAttempt.create({
        data: {
          examId,
          studentId: normalizedId,
          studentName: studentName.trim(),
          totalPoints,
          status: 'IN_PROGRESS',
        },
        include: {
          answers: true,
          violations: true,
          exam: { include: { questions: true } },
        },
      });
      return { attempt: created as any, isNew: true };
    }

    const store = getMockStore();
    const newAttempt: StudentAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examId,
      studentId: normalizedId,
      studentName: studentName.trim(),
      startedAt: new Date(),
      status: 'IN_PROGRESS',
      tabSwitchCount: 0,
      totalPoints,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastHeartbeat: new Date(),
    };
    store.attempts.push(newAttempt);
    return { attempt: { ...newAttempt, answers: [], violations: [], exam: exam || undefined }, isNew: true };
  },

  async unlockAttempt(attemptId: string, instructorId: string): Promise<StudentAttempt> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return (await prisma.studentAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'IN_PROGRESS',
          submittedAt: null,
          tabSwitchCount: 0, // Reset infractions upon instructor explicit pardon
        },
        include: { answers: true, violations: true },
      })) as any;
    }
    const store = getMockStore();
    const att = store.attempts.find((a) => a.id === attemptId);
    if (!att) throw new Error('Attempt not found');
    att.status = 'IN_PROGRESS';
    att.submittedAt = null;
    att.tabSwitchCount = 0;
    att.updatedAt = new Date();
    return att;
  },

  async syncStudentAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswer: string | string[]
  ): Promise<StudentAnswer> {
    // Grade single answer dynamically
    let isCorrect = false;
    let pointsAwarded = 0.0;

    const isPg = await testPrismaConnection();
    if (isPg) {
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (question) {
        const correctAnswers = (question.correctAnswers as string[]) || [];
        if (question.type === 'SINGLE_CHOICE') {
          const selected = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer;
          isCorrect = correctAnswers.some((ans) => ans.toUpperCase() === String(selected).toUpperCase());
        } else if (question.type === 'MULTIPLE_CHOICE') {
          const selectedArr = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
          const sortedSelected = [...selectedArr].map((s) => String(s).toUpperCase()).sort();
          const sortedCorrect = [...correctAnswers].map((c) => String(c).toUpperCase()).sort();
          isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
        } else if (question.type === 'SHORT_ANSWER') {
          const text = String(Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer).trim().toLowerCase();
          isCorrect = correctAnswers.some((ans) => ans.trim().toLowerCase() === text);
        }
        pointsAwarded = isCorrect ? question.points : 0.0;
      }

      return (await prisma.studentAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId } },
        update: {
          selectedAnswer: selectedAnswer as any,
          isCorrect,
          pointsAwarded,
          savedAt: new Date(),
        },
        create: {
          attemptId,
          questionId,
          selectedAnswer: selectedAnswer as any,
          isCorrect,
          pointsAwarded,
        },
      })) as any;
    }

    const store = getMockStore();
    const question = store.questions.find((q) => q.id === questionId);
    if (question) {
      const correctAnswers = question.correctAnswers || [];
      if (question.type === 'SINGLE_CHOICE') {
        const selected = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer;
        isCorrect = correctAnswers.some((ans) => ans.toUpperCase() === String(selected).toUpperCase());
      } else if (question.type === 'MULTIPLE_CHOICE') {
        const selectedArr = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
        const sortedSelected = [...selectedArr].map((s) => String(s).toUpperCase()).sort();
        const sortedCorrect = [...correctAnswers].map((c) => String(c).toUpperCase()).sort();
        isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
      } else if (question.type === 'SHORT_ANSWER') {
        const text = String(Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer).trim().toLowerCase();
        isCorrect = correctAnswers.some((ans) => ans.trim().toLowerCase() === text);
      }
      pointsAwarded = isCorrect ? question.points : 0.0;
    }

    let existingAns = store.answers.find((a) => a.attemptId === attemptId && a.questionId === questionId);
    if (existingAns) {
      existingAns.selectedAnswer = selectedAnswer;
      existingAns.isCorrect = isCorrect;
      existingAns.pointsAwarded = pointsAwarded;
      existingAns.savedAt = new Date();
      return existingAns;
    }

    const newAns: StudentAnswer = {
      id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attemptId,
      questionId,
      selectedAnswer,
      isCorrect,
      pointsAwarded,
      savedAt: new Date(),
    };
    store.answers.push(newAns);
    return newAns;
  },

  async recordViolation(
    attemptId: string,
    type: ViolationType,
    details?: string
  ): Promise<{ log: ViolationLog; attempt: StudentAttempt }> {
    const isPg = await testPrismaConnection();
    if (isPg) {
      return await prisma.$transaction(async (tx) => {
        const log = await tx.violationLog.create({
          data: {
            attemptId,
            type,
            details,
          },
        });

        const updateData: any = {};
        if (type === 'TAB_SWITCH') {
          updateData.tabSwitchCount = { increment: 1 };
        }

        const attempt = await tx.studentAttempt.update({
          where: { id: attemptId },
          data: updateData,
          include: { exam: true },
        });

        return { log: log as any, attempt: attempt as any };
      });
    }

    const store = getMockStore();
    const log: ViolationLog = {
      id: `v-${Date.now()}`,
      attemptId,
      type,
      details: details || null,
      timestamp: new Date(),
    };
    store.violations.push(log);

    const att = store.attempts.find((a) => a.id === attemptId);
    if (att && type === 'TAB_SWITCH') {
      att.tabSwitchCount += 1;
      att.updatedAt = new Date();
    }

    return { log, attempt: att! };
  },

  async updateHeartbeat(attemptId: string): Promise<void> {
    const store = getMockStore();
    const att = store.attempts.find((a) => a.id === attemptId);
    if (att) {
      att.lastHeartbeat = new Date();
      att.updatedAt = new Date();
    }
  },

  async submitAttempt(
    attemptId: string,
    status: AttemptStatus = 'SUBMITTED',
    failSafeAnswers?: Record<string, string | string[]>
  ): Promise<StudentAttempt> {
    // If fail-safe answers provided, persist any that might be missing
    if (failSafeAnswers) {
      for (const [qId, ans] of Object.entries(failSafeAnswers)) {
        await this.syncStudentAnswer(attemptId, qId, ans);
      }
    }

    // Compute final cumulative score and percentage
    const isPg = await testPrismaConnection();
    if (isPg) {
      return await prisma.$transaction(async (tx) => {
        const answers = await tx.studentAnswer.findMany({ where: { attemptId } });
        const attempt = await tx.studentAttempt.findUnique({
          where: { id: attemptId },
          include: { exam: { include: { questions: true } } },
        });
        if (!attempt) throw new Error('Attempt not found');

        const totalPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0) || 1.0;
        const totalScore = answers.reduce((sum, a) => sum + (a.pointsAwarded || 0.0), 0);
        const percentage = Number(((totalScore / totalPoints) * 100).toFixed(2));

        return (await tx.studentAttempt.update({
          where: { id: attemptId },
          data: {
            status,
            submittedAt: new Date(),
            score: totalScore,
            totalPoints,
            percentage,
          },
          include: {
            answers: true,
            violations: true,
            exam: { include: { course: true, questions: true } },
          },
        })) as any;
      });
    }

    const store = getMockStore();
    const att = store.attempts.find((a) => a.id === attemptId);
    if (!att) throw new Error('Attempt not found');

    const exam = store.exams.find((e) => e.id === att.examId);
    const questions = store.questions.filter((q) => q.examId === att.examId);
    const answers = store.answers.filter((a) => a.attemptId === attemptId);

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) || 1.0;
    const totalScore = answers.reduce((sum, a) => sum + (a.pointsAwarded || 0.0), 0);
    const percentage = Number(((totalScore / totalPoints) * 100).toFixed(2));

    att.status = status;
    att.submittedAt = new Date();
    att.score = totalScore;
    att.totalPoints = totalPoints;
    att.percentage = percentage;
    att.updatedAt = new Date();

    return { ...att, answers, violations: store.violations.filter((v) => v.attemptId === attemptId), exam };
  },
};
