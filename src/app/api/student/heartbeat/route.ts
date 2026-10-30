import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    await dbService.updateHeartbeat(attemptId);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
