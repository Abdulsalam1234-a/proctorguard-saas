import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await dbService.getCoursesByInstructor(session.id);
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, title } = await req.json();
    if (!code || !title) {
      return NextResponse.json({ error: 'Course code and title are required' }, { status: 400 });
    }

    const course = await dbService.createCourse({
      code,
      title,
      instructorId: session.id,
    });

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
