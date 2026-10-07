import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import '../config/firebase';
import { getAuth } from 'firebase-admin/auth';
import User, { UserRole } from '../models/User';
import Ticket from '../models/Ticket';
import { env } from '../config/env';

let io: SocketIOServer;

const extractToken = (socket: Socket): string | null => {
  const authToken = (socket.handshake.auth as { token?: string })?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  return null;
};

export const initSocketIO = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = await getAuth().verifyIdToken(token);
      let user = await User.findOne({ firebaseUid: decoded.uid });

      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email });
        if (user) {
          user.firebaseUid = decoded.uid;
          await user.save();
        }
      }

      if (!user) {
        return next(new Error('Unauthorized'));
      }

      socket.data.userId = String(user.id || user._id);
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id} (user ${socket.data.userId})`);

    // Auto-join the authenticated user's private room
    socket.join(socket.data.userId);

    socket.on('join', (userId: string) => {
      if (!userId || String(userId) !== String(socket.data.userId)) {
        socket.emit('error', { message: 'غير مسموح الانضمام لهذه الغرفة' });
        return;
      }
      socket.join(String(userId));
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on('joinTicket', async (ticketId: string) => {
      try {
        if (!ticketId) return;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
          socket.emit('error', { message: 'التذكرة غير موجودة' });
          return;
        }

        const isOwner = String(ticket.userId) === String(socket.data.userId);
        const isAdmin = socket.data.role === UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
          socket.emit('error', { message: 'غير مسموح الانضمام لتذكرة الدعم' });
          return;
        }

        socket.join(`ticket_${ticketId}`);
        console.log(`Socket ${socket.id} joined room ticket_${ticketId}`);
      } catch (error) {
        socket.emit('error', { message: 'فشل الانضمام للتذكرة' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
