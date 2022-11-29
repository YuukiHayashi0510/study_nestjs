import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { Msg, Jwt } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async signUp(dto: AuthDto): Promise<Msg> {
    // 第二引数ラウンズ：今回は2^12回ハッシュ演算をする
    const hashed = await bcrypt.hash(dto.password, 12);
    try {
      await this.prisma.user.create({
        data: {
          email: dto.email,
          hashedPassword: hashed,
        },
      });
      return { message: 'ok' };
    } catch (error) {
      // Prismaの操作に伴うエラーは↓に定義
      if (error instanceof PrismaClientKnownRequestError) {
        // unique制約に引っかかった場合, P2002: Unique constraint failed
        if (error.code === 'P2002') {
          throw new ForbiddenException('This email is already taken.');
        }
      }
      throw error;
    }
  }

  async login(dto: AuthDto): Promise<Jwt> {
    // 検索
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) throw new ForbiddenException('Email or password incorrect');
    // hashの比較, 一致すればtrue
    const isValid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!isValid) throw new ForbiddenException('Email or password incorrect');

    return this.generateJwt(user.id, user.email);
  }

  async generateJwt(userId: number, email: string): Promise<Jwt> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      // accessTokenの有効期限5分
      expiresIn: '5m',
      secret,
    });

    return {
      accessToken: token,
    };
  }
}
