const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ProctorGuard PostgreSQL database...');

  // 1. Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proctorguard.edu.ng' },
    update: {},
    create: {
      email: 'admin@proctorguard.edu.ng',
      passwordHash: '$2a$10$wU05e7m.qF9x1aX/B3jZuee35l9kZtwkKzUaU557jQ/bQW6R1i47y', // Admin@2026!
      name: 'Engr. Mustapha Bello (NUC Admin)',
      role: 'SUPER_ADMIN',
      institution: 'National Universities Commission (NUC)',
      department: 'ICT & Academic Accreditation Board',
      subscription: {
        create: {
          tier: 'PREMIUM',
          status: 'ACTIVE',
          maxStudents: 10000,
          maxExamsPerMonth: 1000,
          storageLimitMb: 50000,
        },
      },
    },
  });

  // 2. Instructor: Dr. Folashade Adewale (UNILAG)
  const lecturer1 = await prisma.user.upsert({
    where: { email: 'dradewale@unilag.edu.ng' },
    update: {},
    create: {
      email: 'dradewale@unilag.edu.ng',
      passwordHash: '$2a$10$wU05e7m.qF9x1aX/B3jZuee35l9kZtwkKzUaU557jQ/bQW6R1i47y', // Lecturer@2026!
      name: 'Dr. Folashade Adewale',
      role: 'INSTRUCTOR',
      institution: 'University of Lagos (UNILAG)',
      department: 'Banking & Commercial Law',
      subscription: {
        create: {
          tier: 'PRO',
          status: 'ACTIVE',
          maxStudents: 300,
          maxExamsPerMonth: 25,
          storageLimitMb: 1000,
        },
      },
    },
  });

  // 3. Instructor: Prof. Abubakar Ibrahim (ABU Zaria)
  const lecturer2 = await prisma.user.upsert({
    where: { email: 'profibrahim@abu.edu.ng' },
    update: {},
    create: {
      email: 'profibrahim@abu.edu.ng',
      passwordHash: '$2a$10$wU05e7m.qF9x1aX/B3jZuee35l9kZtwkKzUaU557jQ/bQW6R1i47y',
      name: 'Prof. Abubakar Ibrahim',
      role: 'INSTRUCTOR',
      institution: 'Ahmadu Bello University (ABU Zaria)',
      department: 'Computer Science & Software Engineering',
      subscription: {
        create: {
          tier: 'PREMIUM',
          status: 'ACTIVE',
          maxStudents: 1000,
          maxExamsPerMonth: 100,
          storageLimitMb: 5000,
        },
      },
    },
  });

  // 4. Courses
  const courseLaw = await prisma.course.create({
    data: {
      code: 'LAW301',
      title: 'Nigerian Commercial & Corporate Law II',
      instructorId: lecturer1.id,
    },
  });

  const courseFin = await prisma.course.create({
    data: {
      code: 'FIN301',
      title: 'Financial Institutions & Capital Markets in Nigeria',
      instructorId: lecturer1.id,
    },
  });

  const courseCsc = await prisma.course.create({
    data: {
      code: 'CSC201',
      title: 'Data Structures & Algorithms in Low-Bandwidth Systems',
      instructorId: lecturer2.id,
    },
  });

  // 5. Exam: LAW301-2026
  const examLaw = await prisma.exam.create({
    data: {
      courseId: courseLaw.id,
      title: 'Mid-Semester CBT Assessment: Company Formation & CAMA 2020',
      accessCode: 'LAW301-2026',
      durationMinutes: 45,
      passMarkPercentage: 50.0,
      randomizeQuestions: true,
      randomizeOptions: true,
      maxTabSwitches: 3,
      requireCamera: true,
      isPublished: true,
      questions: {
        create: [
          {
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
          },
          {
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
          },
          {
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
          },
          {
            orderIndex: 4,
            prompt: 'What Latin legal maxim establishes the fundamental rule of corporate separate legal personality as laid down in Salomon v Salomon & Co Ltd?',
            type: 'SHORT_ANSWER',
            options: [],
            correctAnswers: ['persona ficta', 'corporate veil', 'separate legal personality'],
            points: 3.0,
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed script error (PostgreSQL might be offline):', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
