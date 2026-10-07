import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTicketRoom(ticketId: string) {
    if (this.socket) {
      this.socket.emit('joinTicket', ticketId);
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  offNewMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('newMessage', callback);
      } else {
        this.socket.off('newMessage');
      }
    }
  }
}

export default new SocketService();
