import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await dbService.updateQuestion(params.id, body);
    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Question update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await dbService.deleteQuestion(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Question delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
