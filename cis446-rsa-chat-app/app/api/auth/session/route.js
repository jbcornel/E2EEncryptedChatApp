import { prisma } from '@/lib/prisma';
import { getUserIdFromCookies } from '@/lib/sessionManager';
import { NextResponse } from 'next/server';

export async function GET() {
  const userId = await getUserIdFromCookies();
  if (!userId) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: { id: true, username: true },
  });

  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
