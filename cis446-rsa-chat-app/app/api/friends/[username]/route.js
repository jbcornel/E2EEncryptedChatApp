import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/sessionManager';

export async function DELETE(req, context) {
  const params = await context.params;
  const userId = getUserIdFromRequest(req);
  const username = params.username;

  if (!userId || !username) {
    return Response.json({ error: 'Unauthorized or missing username' }, { status: 401 });
  }

  const friend = await prisma.user.findUnique({
    where: { username },
  });

  if (!friend) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.friend.deleteMany({
    where: {
      OR: [
        { userId: parseInt(userId), friendId: friend.id },
        { userId: friend.id, friendId: parseInt(userId) },
      ],
    },
  });

  if (req.socket?.server?.io) {
    const io = req.socket.server.io;
    const userRoom = `friends:${userId}`;
    const friendRoom = `friends:${friend.id}`;

    io.to(userRoom).emit('friend-list-updated', {});
    io.to(friendRoom).emit('friend-list-updated', {});
  }

  return Response.json({ success: true });
}
