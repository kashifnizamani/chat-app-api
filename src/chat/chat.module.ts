import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
