import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied: Super Admin credentials required' }, { status: 403 });
    }

    const instructorId = params.id;
    const body = await req.json();
    const { tier, status, maxStudents, maxExamsPerMonth, storageLimitMb, reason } = body;

    const updatedSub = await dbService.updateTenantSubscription(session.id, instructorId, {
      tier,
      status,
      maxStudents: maxStudents !== undefined ? Number(maxStudents) : undefined,
      maxExamsPerMonth: maxExamsPerMonth !== undefined ? Number(maxExamsPerMonth) : undefined,
      storageLimitMb: storageLimitMb !== undefined ? Number(storageLimitMb) : undefined,
      reason,
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSub,
      message: 'Subscription tier and quotas updated successfully. Audit log and in-app alert dispatched.',
    });
  } catch (error: any) {
    console.error('Update tenant error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
