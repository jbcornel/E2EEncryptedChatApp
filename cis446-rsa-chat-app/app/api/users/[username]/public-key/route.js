import { prisma } from '@/lib/prisma';

export async function GET(req, context) {
  const { username } = await context.params;

  if (!username) {
    return Response.json({ error: 'Username is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username: username },
    select: { publicKey: true }
  });

  if (!user || !user.publicKey) {
    return Response.json({ error: 'User or public key not found' }, { status: 404 });
  }

  return Response.json({ publicKey: user.publicKey });
}
