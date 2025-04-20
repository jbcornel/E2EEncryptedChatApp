
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/sessionManager';

export async function PUT(req, context) {
  const userId = getUserIdFromRequest(req);
  const { id } = await context.params;
  const { content } = await req.json();

  if (!userId || !content?.trim()) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: parseInt(id) },
  });

  if (!message || message.senderId !== parseInt(userId)) {
    return Response.json({ error: 'Not allowed to edit this message' }, { status: 403 });
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { content }, //save encrypted content from client
  });

  return Response.json(updated); //return encrypted content
}

export async function DELETE(req, context) {
  const userId = getUserIdFromRequest(req);
  const { id } = await context.params;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const message = await prisma.message.findUnique({
    where: { id: parseInt(id) },
  });

  if (!message || message.senderId !== parseInt(userId)) {
    return Response.json({ error: 'Not allowed to delete this message' }, { status: 403 });
  }

  await prisma.message.delete({
    where: { id: message.id },
  });

  return Response.json({ success: true });
}
