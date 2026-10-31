import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbService } from '@/lib/db-service';
import { SubscriptionTier } from '@/lib/types';
import { PRICING_PLANS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Staff credentials required' }, { status: 401 });
    }

    const { tier, billingCycle = 'monthly', currency = 'NGN', paymentMethod = 'paystack' } = await req.json();

    if (!tier || !['MEMBER', 'PRO', 'PREMIUM'].includes(tier)) {
      return NextResponse.json({ error: 'Valid tier (MEMBER, PRO, PREMIUM) is required' }, { status: 400 });
    }

    const targetPlan = PRICING_PLANS.find((p) => p.id === tier);
    if (!targetPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const isAnnual = billingCycle === 'annual';
    const durationMonths = isAnnual ? 12 : 1;
    const amount =
      currency === 'USD'
        ? isAnnual
          ? targetPlan.priceAnnualUsd
          : targetPlan.priceMonthlyUsd
        : isAnnual
        ? targetPlan.priceAnnualNgn
        : targetPlan.priceMonthlyNgn;

    const paymentRef = `PG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Upgrade subscription in database
    const updatedSub = await dbService.upgradeSubscription(
      session.id,
      tier as SubscriptionTier,
      durationMonths,
      paymentRef
    );

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const receipt = {
      receiptNumber,
      invoiceNumber: receiptNumber,
      paymentRef,
      tier: targetPlan.name,
      tierId: tier,
      billingCycle: isAnnual ? 'Annual (12 Months)' : 'Monthly (1 Month)',
      currency,
      amount,
      paidAt: new Date().toISOString(),
      institution: session.institution || 'Institutional Account',
      instructorName: session.name,
      instructorEmail: session.email,
      paymentMethod: paymentMethod === 'paystack' ? 'Paystack / Card Gateway' : 'Bank Direct Transfer',
      status: 'PAID',
    };

    return NextResponse.json({
      success: true,
      subscription: updatedSub,
      receipt,
      message: `Successfully upgraded to ${targetPlan.name}. Quota increased to ${targetPlan.maxStudents} students and ${
        targetPlan.maxExamsPerMonth === -1 ? 'unlimited' : targetPlan.maxExamsPerMonth
      } tests.`,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
