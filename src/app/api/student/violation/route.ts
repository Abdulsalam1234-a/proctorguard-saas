import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const attemptId = body.attemptId;
    const type = body.type || body.violationType;
    const details = body.details || body.metadata;

    if (!attemptId || !type) {
      return NextResponse.json({ error: 'attemptId and type are required' }, { status: 400 });
    }

    const { log, attempt } = await dbService.recordViolation(attemptId, type, details);

    // Check breach status against exam's max allowed tab switches
    const exam = await dbService.getExamById(attempt.examId);
    const maxAllowed = exam?.maxTabSwitches ?? 3;
    const breached = attempt.tabSwitchCount > maxAllowed;

    return NextResponse.json({
      success: true,
      violationId: log.id,
      violationType: log.type,
      tabSwitchCount: attempt.tabSwitchCount,
      maxAllowed,
      breached,
    });
  } catch (error: any) {
    console.error('Record violation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
