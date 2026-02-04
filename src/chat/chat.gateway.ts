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

@WebSocketGateway(8080, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`New Client connected: ${client.id}`);

    this.server.emit('user-joined', {
      message: 'New User joined the chat: ' + client.id,
    });
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
}
