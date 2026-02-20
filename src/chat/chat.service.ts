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
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
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
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async getAllRooms() {
    return this.prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
