import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    const unlocked = await dbService.unlockAttempt(attemptId, session.id);

    return NextResponse.json({
      success: true,
      attempt: unlocked,
      message: `Candidate ${unlocked.studentName} (${unlocked.studentId}) attempt unlocked successfully. Re-entry is now permitted.`,
    });
  } catch (error: any) {
    console.error('Unlock attempt error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
