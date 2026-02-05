import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/auth.guard';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChatService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findOne(payload.sub);
      if (!user) return null;
      return user;
    } catch {
      return null;
    }
  }
}
