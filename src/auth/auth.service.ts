import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, toAuthUser } from '../users/user.serializer';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const AVATAR_POOL = ['🎣', '🐟', '🐠', '🦈', '🐡', '⚓', '🛶', '🪝'];
const BCRYPT_ROUNDS = 10;

export interface AuthResult {
  token: string;
  user: AuthUserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username: { equals: username, mode: 'insensitive' } }] },
    });
    if (existing) {
      if (existing.email === email) {
        throw new ConflictException('ეს ელ-ფოსტა უკვე რეგისტრირებულია');
      }
      throw new ConflictException('ეს სახელი უკვე დაკავებულია');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const avatar = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];

    const user = await this.prisma.user.create({
      data: { username, email, password: passwordHash, avatar },
    });

    return this.buildResult(user.id, toAuthUser(user));
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('ელ-ფოსტა ან პაროლი არასწორია');
    }
    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('ელ-ფოსტა ან პაროლი არასწორია');
    }
    return this.buildResult(user.id, toAuthUser(user));
  }

  private buildResult(userId: string, user: AuthUserDto): AuthResult {
    const token = this.jwt.sign({ sub: userId });
    return { token, user };
  }
}
