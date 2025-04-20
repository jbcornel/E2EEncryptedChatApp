import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/sessionManager';

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const withUsername = searchParams.get('with');

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (withUsername) {
    const partner = await prisma.user.findUnique({ where: { username: withUsername } });
    if (!partner) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: parseInt(userId), receiverId: partner.id },
          { senderId: partner.id, receiverId: parseInt(userId) },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return Response.json(messages);
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: parseInt(userId) },
        { receiverId: parseInt(userId) },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  const seen = new Set();
  const latestConversations = [];

  for (const msg of messages) {
    const partnerId = msg.senderId === parseInt(userId) ? msg.receiverId : msg.senderId;
    if (!seen.has(partnerId)) {
      const partner = await prisma.user.findUnique({ where: { id: partnerId } });
      if (partner) {
        latestConversations.push({
          with: partner.username,
          lastMessage: msg.content, //still encrypted
        });
        seen.add(partnerId);
      }
    }
  }

  return Response.json(latestConversations);
}

export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  const { to, content } = await req.json();

  const partner = await prisma.user.findUnique({ where: { username: to } });
  if (!userId || !partner || !content.trim()) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: parseInt(userId),
      receiverId: partner.id,
      content, 
      // store encrypted string as-is
    },
  });

  return Response.json(message); //encrypted content is returned to client
}

