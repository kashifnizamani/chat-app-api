import { UseGuards } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
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
import { AuthGuard } from 'src/auth/auth.guard';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @ApiProperty()
  @UseGuards(AuthGuard)
  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token || client.handshake.headers['authorization'];
    const user = await this.chatService.validateToken(token);
    if (!user) {
      console.log('Unauthorized connection rejected.');
      return client.disconnect(); // Hard close
    }

    client['user'] = user; // Now the socket has an identity
    this.server.emit('presence', { user: user.username, status: 'online' });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.server.emit('user-left', {
      message: 'User left the chat: ' + client.id,
    });
  }

  @SubscribeMessage('message')
  handleEvent(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(message);

    client.emit('reply', 'Hello from server');
    this.server.emit('reply', 'Hello to all clients!');
  }

  @SubscribeMessage('user')
  handleBroadcastEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('hello there');
    console.log('Broadcasted by: ' + client.id);
  }
}
