import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { SocketUser } from './chat.types';

interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  // ---------- AUTH ----------
  async handleConnection(client: AuthenticatedSocket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers['authorization'] as string);

    const user = await this.authService.validateToken(token);

    if (!user) {
      console.log('Unauthorized connection rejected.');
      return client.disconnect();
    }

    client.data.user = user;

    this.server.emit('presence', {
      user: user.username,
      status: 'online',
    });

    const allSockets = await this.server.fetchSockets();
    for (const s of allSockets) {
      const existingUser = (s as unknown as AuthenticatedSocket).data?.user;
      if (existingUser && existingUser.username !== user.username) {
        client.emit('presence', {
          user: existingUser.username,
          status: 'online',
        });
      }
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      // Get all rooms the socket is in
      const rooms = Array.from(client.rooms).filter((r) => r !== client.id);
      rooms.forEach((roomId) => {
        this.server.to(roomId).emit('userLeft', {
          roomId,
          user: user.username,
        });
      });

      this.server.emit('presence', {
        user: user.username,
        status: 'offline',
      });
    }
  }

  @SubscribeMessage('getRooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const rooms = await this.chatService.getAllRooms(); // implement in service
    client.emit('roomList', rooms);
  }
  @SubscribeMessage('getRoomUsers')
  async handleGetRoomUsers(
    @MessageBody() raw: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const roomId = payload?.roomId;
    if (!roomId) return client.emit('error', 'Room ID required');

    const sockets = await this.server.in(roomId).fetchSockets();
    const users = sockets.map(
      (s) => (s as unknown as AuthenticatedSocket).data.user.username,
    );
    client.emit('roomUsers', { roomId, users });
  }

  // ---------- CREATE ROOM ----------
  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() raw: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (!payload?.name) {
      return client.emit('error', 'Room name required');
    }

    const room = await this.chatService.createRoom(
      payload.name,
      payload.isGroup ?? false,
    );

    client.join(room.id);

    console.log(
      `${client.data.user.username} created & joined room ${room.id} (${room.name})`,
    );

    // ✅ send room info back to creator
    client.emit('roomCreated', room);
  }

  // ---------- JOIN ROOM ----------
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() raw: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const roomId = payload?.roomId;

    if (!roomId) {
      return client.emit('error', 'Room ID required');
    }

    const room = await this.chatService.findRoomById(roomId);
    if (!room) {
      return client.emit('error', 'Room does not exist');
    }

    const canJoin = await this.chatService.canUserJoinRoom(
      client.data.user.id,
      roomId,
    );

    if (!canJoin) {
      return client.emit('error', 'Access denied');
    }

    client.join(roomId);

    console.log(`${client.data.user.username} joined room ${roomId}`);

    const history = await this.chatService.getMessagesByRoom(roomId);

    this.server.to(roomId).emit('userJoined', {
      roomId,
      user: client.data.user.username,
    });

    client.emit('roomHistory', history);
  }

  // ---------- SEND MESSAGE ----------
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: any,
  ) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const { roomId, content } = payload || {};

    if (!roomId || !content) {
      console.error('Invalid message payload:', payload);
      return;
    }
    const room = await this.chatService.findRoomById(roomId);
    if (!room) {
      return client.emit('error', 'Cannot send message to nonexistent room');
    }

    const message = await this.chatService.saveMessage(
      client.data.user.id,
      roomId,
      content,
    );

    // debug: show sockets in room
    const sockets = (await this.server.in(roomId).fetchSockets()).map(
      (s) => s.id,
    );

    console.log('Sockets in room', roomId, sockets);

    console.log(message);
    this.server.to(roomId).emit('newMessage', message);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() raw: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const roomId = payload?.roomId;

    if (!roomId) {
      return client.emit('error', 'Room ID required');
    }

    client.leave(roomId);

    this.server.to(roomId).emit('userLeft', {
      roomId,
      user: client.data.user.username,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() raw: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const { roomId, isTyping } = payload || {};
    if (!roomId) return client.emit('error', 'Room ID required');

    this.server.to(roomId).emit('typing', {
      user: client.data.user.username,
      isTyping,
    });
  }
}
