import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';
//Register user
export async function POST(req) {
  const { username, email, password } = await req.json();
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return Response.json({ error: 'User already exists' }, { status: 400 });
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { username, email, password: hashed } });
  return Response.json({ success: true });
}
