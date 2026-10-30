import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cloned = await dbService.cloneExam(params.id, session.id);
    return NextResponse.json({
      success: true,
      exam: cloned,
      message: `Exam duplicated successfully with new access code ${cloned.accessCode}`,
    });
  } catch (error: any) {
    console.error('Clone exam error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
