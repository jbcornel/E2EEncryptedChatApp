import { Server } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

let io;

export default function handler(req, res) {
  if (!res.socket?.server?.io) {
    console.log('Initializing Socket.IO server...');
    io = new Server(res.socket.server, {
      path: '/api/socket',
    });

    res.socket.server.io = io;

    io.on('connection', socket => {
      console.log('Socket connected:', socket.id);

      socket.on('join-room', room => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
      });

      socket.on('send-message', ({ room, message }) => {
        console.log(`send-message to ${room}`, message);
        socket.to(room).emit('receive-message', message);
      });

      socket.on('edit-message', ({ room, message }) => {
        console.log(`✏️ edit-message in ${room}`, message);
        socket.to(room).emit('message-edited', message);
      });

      socket.on('delete-message', ({ room, id }) => {
        console.log(` delete-message in ${room}, ID: ${id}`);
        socket.to(room).emit('message-deleted', id);
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  res.end();
}

