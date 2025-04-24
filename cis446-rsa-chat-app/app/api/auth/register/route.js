import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { username, email, password, publicKey } = await req.json();

  if (!username || !email || !password || !publicKey) {
    return NextResponse.json({ error: 'All fields required (including publicKey)' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });
  if (existing)
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { username, email, password: hashed, publicKey }
  });

  return NextResponse.json({ success: true });
}

