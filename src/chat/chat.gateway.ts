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
  server: Server;

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
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      this.server.emit('presence', {
        user: user.username,
        status: 'offline',
      });
    }
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

    // ✅ auto-join creator
    client.join(room.id);

    console.log(
      `${client.data.user.username} created & joined room ${room.id}`,
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

    this.server.to(roomId).emit('newMessage', message);
  }
}
