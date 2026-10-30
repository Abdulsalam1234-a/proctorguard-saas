import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const attemptId = body.attemptId;
    const questionId = body.questionId;
    const selectedAnswer = body.selectedAnswer !== undefined ? body.selectedAnswer : body.selectedOptionId;
    const clientTimestamp = body.clientTimestamp;

    if (!attemptId || !questionId || selectedAnswer === undefined) {
      return NextResponse.json({ error: 'attemptId, questionId, and selectedAnswer are required' }, { status: 400 });
    }

    const savedAnswer = await dbService.syncStudentAnswer(attemptId, questionId, selectedAnswer);

    return NextResponse.json({
      success: true,
      answerId: savedAnswer.id,
      savedAt: savedAnswer.savedAt,
      clientTimestamp,
    });
  } catch (error: any) {
    console.error('Answer sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
