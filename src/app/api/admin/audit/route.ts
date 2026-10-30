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

    const auditLogs = await dbService.getAuditLogs();
    return NextResponse.json({ auditLogs, logs: auditLogs });
  } catch (error: any) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
