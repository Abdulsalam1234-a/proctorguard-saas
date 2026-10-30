import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied: Super Admin credentials required' }, { status: 403 });
    }

    const { attemptId, newScore, reason } = await req.json();

    if (!attemptId || newScore === undefined || !reason) {
      return NextResponse.json({ error: 'attemptId, newScore, and justification reason are required' }, { status: 400 });
    }

    const updated = await dbService.superAdminOverrideScore(session.id, attemptId, Number(newScore), reason);

    return NextResponse.json({
      success: true,
      attempt: updated,
      message: 'Score successfully overridden. Audit trail entry created and instructor notified.',
    });
  } catch (error: any) {
    console.error('Score override error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
