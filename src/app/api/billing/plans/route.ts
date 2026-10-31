import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';
import { PRICING_PLANS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    let currentSubscription = null;

    if (session) {
      const user = await dbService.findUserById(session.id);
      currentSubscription = user?.subscription || null;
    }

    return NextResponse.json({
      success: true,
      plans: PRICING_PLANS,
      currentSubscription,
      marketComparison: {
        note: 'ProctorGuard provides up to 70% cost savings compared to legacy Western proctoring platforms ($3-$10 per test) with native Nigerian bandwidth resilience.',
        currency: 'NGN / USD',
      },
    });
  } catch (error: any) {
    console.error('Fetch pricing plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
