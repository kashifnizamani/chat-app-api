import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/skipAuth.decorator';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    let token: string | undefined;
    let request: any;

    const type = context.getType();
    if (type === 'http') {
      request = context.switchToHttp().getRequest<Request>();
      token = this.extractTokenFromHeader(request);
    } else if (type === 'ws') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      request = context.switchToWs().getClient();
      token =
        request.handshake?.auth?.token ||
        request.handshake?.headers?.authorization?.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findOne(payload['sub']);
      request.user = user;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
