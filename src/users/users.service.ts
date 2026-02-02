import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  createUser(data: { username: string; email: string; password: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  findbyEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
