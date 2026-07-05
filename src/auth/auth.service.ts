import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserDto, toAuthUser } from '../users/user.serializer';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

const AVATAR_POOL = ['🎣', '🐟', '🐠', '🦈', '🐡', '⚓', '🛶', '🪝'];
const BCRYPT_ROUNDS = 10;

const CODE_TTL_MS = 10 * 60 * 1000; // codes are valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // min wait between code requests
const MAX_VERIFY_ATTEMPTS = 5; // wrong tries before the code is invalidated

export interface AuthResult {
  token: string;
  user: AuthUserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  // Step 1 of registration: validate the details, email a 6-digit code, and stash
  // the pending registration. NO real user is created yet — so a fake/mistyped
  // email never becomes an account because the code can't be received.
  async requestRegistrationCode(dto: RegisterDto): Promise<{ email: string }> {
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();

    await this.assertAvailable(email, username);

    // Throttle resends so the same email can't be spammed with codes.
    const existing = await this.prisma.emailVerification.findUnique({
      where: { email },
    });
    if (existing) {
      const waitMs =
        RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime());
      if (waitMs > 0) {
        throw new BadRequestException(
          `ახალი კოდის მოთხოვნა შესაძლებელია ${Math.ceil(waitMs / 1000)} წამში`,
        );
      }
    }

    const code = randomInt(100000, 1000000).toString(); // 6 digits
    const [codeHash, passwordHash] = await Promise.all([
      bcrypt.hash(code, BCRYPT_ROUNDS),
      bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    ]);
    const avatar = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    const data = {
      username,
      passwordHash,
      avatar,
      codeHash,
      attempts: 0,
      expiresAt,
      lastSentAt: new Date(),
    };
    await this.prisma.emailVerification.upsert({
      where: { email },
      create: { email, ...data },
      update: data,
    });

    // Send last: if the email provider fails we surface the error to the app.
    await this.email.sendVerificationCode(email, code);

    return { email };
  }

  // Step 2: check the code, and only on success create the real account + log in.
  async verifyAndRegister(dto: VerifyCodeDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const pending = await this.prisma.emailVerification.findUnique({
      where: { email },
    });
    if (!pending) {
      throw new BadRequestException('კოდი ვერ მოიძებნა — სცადეთ რეგისტრაცია თავიდან');
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await this.prisma.emailVerification.delete({ where: { email } });
      throw new BadRequestException('კოდს ვადა გაუვიდა — მოითხოვეთ ახალი');
    }

    if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
      await this.prisma.emailVerification.delete({ where: { email } });
      throw new BadRequestException('ბევრი მცდელობა — მოითხოვეთ ახალი კოდი');
    }

    const codeOk = await bcrypt.compare(dto.code, pending.codeHash);
    if (!codeOk) {
      await this.prisma.emailVerification.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('კოდი არასწორია');
    }

    // Code is valid — make sure nothing was taken since step 1, then create.
    await this.assertAvailable(email, pending.username);

    const user = await this.prisma.user.create({
      data: {
        username: pending.username,
        email,
        password: pending.passwordHash,
        avatar: pending.avatar,
      },
    });
    await this.prisma.emailVerification.delete({ where: { email } });

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

  // Throws a 409 if the email or username already belongs to a real account.
  private async assertAvailable(email: string, username: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: { equals: username, mode: 'insensitive' } }],
      },
    });
    if (existing) {
      if (existing.email === email) {
        throw new ConflictException('ეს ელ-ფოსტა უკვე რეგისტრირებულია');
      }
      throw new ConflictException('ეს სახელი უკვე დაკავებულია');
    }
  }

  private buildResult(userId: string, user: AuthUserDto): AuthResult {
    const token = this.jwt.sign({ sub: userId });
    return { token, user };
  }
}
