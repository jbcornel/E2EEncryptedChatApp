import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/sessionManager';

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const friends = await prisma.friend.findMany({
    where: { userId: parseInt(userId) },
    include: {
      friend: {
        select: {
          id: true,
          username: true,
          publicKey: true,   
        },
      },
    },
  });

  const formatted = friends.map(f => ({
    id: f.friend.id,
    username: f.friend.username,
    publicKey: f.friend.publicKey,  
  }));

  return Response.json(formatted);
}


export async function POST(req) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
    const { friendId } = await req.json();
    const userIdInt = parseInt(userId);
    const friendIdInt = parseInt(friendId);
  
    if (!friendId || userIdInt === friendIdInt) {
      return Response.json({ error: 'Invalid friendId' }, { status: 400 });
    }
  
    const existing = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: userIdInt,
          friendId: friendIdInt,
        },
      },
    });
  
    const reciprocal = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: friendIdInt,
          friendId: userIdInt,
        },
      },
    });
  
    const operations = [];
  
    if (!existing) {
      operations.push(
        prisma.friend.create({
          data: {
            userId: userIdInt,
            friendId: friendIdInt,
            status: 'accepted',
          },
        })
      );
    }
  
    if (!reciprocal) {
      operations.push(
        prisma.friend.create({
          data: {
            userId: friendIdInt,
            friendId: userIdInt,
            status: 'accepted',
          },
        })
      );
    }
  
    await Promise.all(operations);
  
    if (req.socket?.server?.io) {
      const io = req.socket.server.io;
      const userRoom = `friends:${userIdInt}`;
      const friendRoom = `friends:${friendIdInt}`;
  
      io.to(userRoom).emit('friend-list-updated', {});
      io.to(friendRoom).emit('friend-list-updated', {});
    }
  
    return Response.json({ success: true });
  }
  