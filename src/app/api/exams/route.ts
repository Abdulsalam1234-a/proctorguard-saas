import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exams = await dbService.getExamsByInstructor(session.id);
    return NextResponse.json({ exams });
  } catch (error: any) {
    console.error('Exams fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await dbService.findUserById(session.id);
    const sub = user?.subscription;

    // Quota verification
    if (sub && sub.maxExamsPerMonth > 0 && sub.currentExamCount >= sub.maxExamsPerMonth) {
      return NextResponse.json(
        {
          error: `Monthly quota reached: Your ${sub.tier} plan allows a maximum of ${sub.maxExamsPerMonth} tests per month. Please upgrade to Pro (10 tests) or Premium (Unlimited tests) to continue.`,
          quotaExceeded: true,
          currentPlan: sub.tier,
          maxExams: sub.maxExamsPerMonth,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      courseId,
      title,
      accessCode,
      durationMinutes,
      passMarkPercentage,
      randomizeQuestions,
      randomizeOptions,
      maxTabSwitches,
      requireCamera,
      isPublished,
    } = body;

    if (!courseId || !title || !accessCode || !durationMinutes) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    // Verify access code uniqueness
    const existing = await dbService.getExamByAccessCode(accessCode);
    if (existing) {
      return NextResponse.json(
        { error: `The access code "${accessCode.toUpperCase()}" is already assigned to another examination.` },
        { status: 409 }
      );
    }

    const exam = await dbService.createExam({
      courseId,
      title,
      accessCode,
      durationMinutes: Number(durationMinutes),
      passMarkPercentage: Number(passMarkPercentage ?? 50),
      randomizeQuestions: Boolean(randomizeQuestions),
      randomizeOptions: Boolean(randomizeOptions),
      maxTabSwitches: Number(maxTabSwitches ?? 3),
      requireCamera: Boolean(requireCamera ?? true),
      isPublished: Boolean(isPublished ?? false),
    });

    return NextResponse.json({ success: true, exam });
  } catch (error: any) {
    console.error('Exam creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
