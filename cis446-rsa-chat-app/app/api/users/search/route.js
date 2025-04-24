import { prisma } from '@/lib/prisma';
import { getUserIdFromCookies, getUserIdFromRequest } from '@/lib/sessionManager';

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const term = searchParams.get('username');

  if (!term || term.trim().length === 0) {
    return Response.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: term,
        
      },
      NOT: { id: parseInt(userId) },
    },
    select: {
      id: true,
      username: true,
    },
  });

  return Response.json(users);
}
