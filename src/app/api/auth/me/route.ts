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

    const user = await dbService.findUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notifications = await dbService.getInstructorNotifications(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institution: user.institution,
        department: user.department,
        subscription: user.subscription,
      },
      notifications,
    });
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
