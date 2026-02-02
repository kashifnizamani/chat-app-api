import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private UsersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.UsersService.createUser({
      username,
      email,
      password: hashedPassword,
    });
  }

  async login(email: string, password: string) {
    const user = await this.UsersService.findbyEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    return {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };
  }
}
