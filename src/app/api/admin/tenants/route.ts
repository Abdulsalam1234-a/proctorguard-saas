import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied: Super Admin credentials required' }, { status: 403 });
    }

    const tenants = await dbService.getAllTenants();

    // Aggregate statistics across all institutions and instructors
    const institutionsSet = new Set(tenants.map((t) => t.institution));
    const totalInstructors = tenants.length;
    let totalExams = 0;
    let totalAttempts = 0;

    tenants.forEach((t) => {
      (t.courses || []).forEach((c: any) => {
        totalExams += c.exams?.length || 0;
        (c.exams || []).forEach((e: any) => {
          totalAttempts += e.attempts?.length || 0;
        });
      });
    });

    return NextResponse.json({
      tenants,
      stats: {
        totalInstitutions: institutionsSet.size,
        totalInstructors,
        totalExams,
        totalAttempts,
      },
    });
  } catch (error: any) {
    console.error('Admin tenants fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
