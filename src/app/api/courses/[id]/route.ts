import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await dbService.deleteCourse(params.id, session.id);
    if (!success) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Course deletion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
