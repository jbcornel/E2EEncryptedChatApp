import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  console.log(user)
  const res = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

  res.cookies.set('x-user-id', String(user.id), {
    path: '/', // available for all routes
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  res.cookies.set('username', user.username, {
    path: '/', // available for all routes
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}