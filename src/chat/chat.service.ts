import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createRoom(name?: string, isGroup = false) {
    return this.prisma.room.create({
      data: {
        name,
        isGroup,
      },
    });
  }

  async findRoomById(roomId: string) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
    });
  }

  async getMessagesByRoom(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async saveMessage(userId: string, roomId: string, content: string) {
    return this.prisma.message.create({
      data: {
        content,
        senderId: userId,
        roomId,
      },
    });
  }

  // 1. Business Logic: Ensure user is allowed to join a room
  async canUserJoinRoom(userId: string, roomId: string): Promise<boolean> {
    // Logic: Check if room is public or if user is a member
    // For now, we'll assume rooms are created on the fly
    return true;
  }
}
