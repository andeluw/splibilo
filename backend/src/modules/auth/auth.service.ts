import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from './entities/auth.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { UserRole } from '@prisma/client';

const REFRESH_TOKEN_TTL_MS = Number(
  process.env.JWT_REFRESH_EXPIRES_IN_MS || 7 * 24 * 60 * 60 * 1000,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async hash(plain: string) {
    return bcrypt.hash(plain, 10);
  }

  private async compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'JWT_ACCESS_SECRET',
      expiresIn: '15m',
    });

    const jti = uuidv4();
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        jti,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'JWT_REFRESH_SECRET',
        expiresIn: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
      },
    );

    const hashedRefreshToken = await this.hash(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        jti,
        token: hashedRefreshToken,
        expires_at: expiresAt,
        user: {
          connect: { id: payload.sub },
        },
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async revokeRefreshTokenByJti(jti: string) {
    await this.prisma.refreshToken.updateMany({
      where: { jti, revoked: false },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await this.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        avatar_url: dto.avatarUrl,
        role: dto.role ?? UserRole.USER,
      },
    });

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.is_suspended) {
      throw new ForbiddenException('Your account has been suspended');
    }

    const valid = await this.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'JWT_REFRESH_SECRET',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, jti } = payload;
    if (!userId || !jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { jti },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (tokenRecord.revoked) {
      throw new ForbiddenException('Refresh token has been revoked');
    }

    if (tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const matches = await bcrypt.compare(dto.refreshToken, tokenRecord.token);
    if (!matches) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    await this.revokeRefreshTokenByJti(jti);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.is_suspended) {
      throw new ForbiddenException('Your account has been suspended');
    }

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logout(userId: string, dto: LogoutDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'JWT_REFRESH_SECRET',
      });

      if (payload.sub !== userId) {
        throw new ForbiddenException('Cannot logout other user');
      }

      if (payload.jti) {
        await this.revokeRefreshTokenByJti(payload.jti);
      }
    } catch {
      await this.prisma.refreshToken.updateMany({
        where: { user_id: userId, revoked: false },
        data: {
          revoked: true,
          revoked_at: new Date(),
        },
      });
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
