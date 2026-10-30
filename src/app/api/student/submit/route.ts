import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';
import { AttemptStatus } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { attemptId, status, failSafeAnswers } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    const finalStatus: AttemptStatus = status || 'SUBMITTED';

    const finalizedAttempt = await dbService.submitAttempt(attemptId, finalStatus, failSafeAnswers);

    return NextResponse.json({
      success: true,
      attempt: {
        id: finalizedAttempt.id,
        studentId: finalizedAttempt.studentId,
        studentName: finalizedAttempt.studentName,
        status: finalizedAttempt.status,
        score: finalizedAttempt.score,
        totalPoints: finalizedAttempt.totalPoints,
        percentage: finalizedAttempt.percentage,
        submittedAt: finalizedAttempt.submittedAt,
        tabSwitchCount: finalizedAttempt.tabSwitchCount,
      },
      message: 'Examination submitted and securely finalized.',
    });
  } catch (error: any) {
    console.error('Submit exam error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
