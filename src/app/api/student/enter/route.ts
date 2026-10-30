import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessCode = body.accessCode;
    const studentId = body.studentId || body.studentIdentifier;
    const studentName = body.studentName;

    if (!accessCode || !studentId || !studentName) {
      return NextResponse.json(
        { error: 'Examination Access Code, Student Matric/Reg Number, and Full Name are all required.' },
        { status: 400 }
      );
    }

    const exam = await dbService.getExamByAccessCode(accessCode);
    if (!exam) {
      return NextResponse.json(
        { error: `No active examination was found matching access code "${accessCode.toUpperCase()}". Please verify code with your instructor.` },
        { status: 404 }
      );
    }

    if (!exam.isPublished) {
      return NextResponse.json(
        { error: 'This examination has not yet been opened or published by the course instructor.' },
        { status: 403 }
      );
    }

    // Single-attempt check and start/resume
    const { attempt, isNew } = await dbService.startOrResumeAttempt(exam.id, studentId, studentName);

    // If attempt is already terminated, reject re-entry unless unlocked
    if (attempt.status !== 'IN_PROGRESS') {
      let statusDesc = 'submitted';
      if (attempt.status === 'AUTO_SUBMITTED_VIOLATION') statusDesc = 'terminated due to excessive proctoring infractions';
      if (attempt.status === 'AUTO_SUBMITTED_TIMEOUT') statusDesc = 'auto-submitted due to time expiration';
      if (attempt.status === 'AUTO_SUBMITTED_NETWORK') statusDesc = 'auto-submitted due to network disconnect';

      return NextResponse.json(
        {
          error: `Examination locked: Candidate ${attempt.studentName} (${attempt.studentId}) has already ${statusDesc} this assessment. Institutional policy permits only a single attempt unless explicitly unlocked by your lecturer.`,
          status: attempt.status,
          score: attempt.score,
          percentage: attempt.percentage,
        },
        { status: 403 }
      );
    }

    // Questions preparation (apply randomization if enabled)
    let questions = [...(exam.questions || [])];
    if (exam.randomizeQuestions) {
      // Deterministic or pseudorandom shuffle based on studentId
      questions.sort((a, b) => {
        const hashA = (a.id + studentId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hashB = (b.id + studentId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hashA - hashB;
      });
    }

    // Strip answers from questions payload before returning to candidate
    const sanitizedQuestions = questions.map((q, idx) => {
      let options = Array.isArray(q.options) ? [...q.options] : [];
      if (exam.randomizeOptions && options.length > 0) {
        options.sort((a: any, b: any) => {
          const optHashA = (a.id + studentId + q.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const optHashB = (b.id + studentId + q.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return optHashA - optHashB;
        });
      }

      return {
        id: q.id,
        orderIndex: idx + 1,
        prompt: q.prompt,
        type: q.type,
        options,
        points: q.points,
      };
    });

    // Compute elapsed time
    const startedAt = new Date(attempt.startedAt).getTime();
    const durationMs = exam.durationMinutes * 60 * 1000;
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    const totalDurationSeconds = exam.durationMinutes * 60;
    const timeRemainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

    return NextResponse.json({
      success: true,
      isNew,
      attempt: {
        id: attempt.id,
        studentId: attempt.studentId,
        studentName: attempt.studentName,
        tabSwitchCount: attempt.tabSwitchCount,
        startedAt: attempt.startedAt,
        answers: attempt.answers || [],
      },
      exam: {
        id: exam.id,
        title: exam.title,
        accessCode: exam.accessCode,
        courseCode: exam.course?.code,
        courseTitle: exam.course?.title,
        durationMinutes: exam.durationMinutes,
        maxTabSwitches: exam.maxTabSwitches,
        requireCamera: exam.requireCamera,
        timeRemainingSeconds,
      },
      questions: sanitizedQuestions,
    });
  } catch (error: any) {
    console.error('Student enter error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
