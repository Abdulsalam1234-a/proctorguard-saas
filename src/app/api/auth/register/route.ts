import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db-service';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password, institution, department, tier } = await req.json();

    if (!name || !email || !password || !institution || !department) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = await dbService.findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await dbService.createUser({
      name,
      email,
      passwordHash,
      institution,
      department,
      role: 'INSTRUCTOR',
      tier: tier || 'MEMBER',
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      institution: user.institution,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institution: user.institution,
        department: user.department,
        subscription: user.subscription,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed: ' + error.message }, { status: 500 });
  }
}
