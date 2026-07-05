import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { toAuthUser } from '../users/user.serializer';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Step 1: validate details + email a verification code (no account yet).
  @Post('request-code')
  @HttpCode(200)
  requestCode(@Body() dto: RegisterDto) {
    return this.authService.requestRegistrationCode(dto);
  }

  // Step 2: verify the code → create the account and return a session token.
  @Post('verify-code')
  @HttpCode(200)
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyAndRegister(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Returns the current user from the bearer token (used to rehydrate sessions).
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return toAuthUser(user);
  }
}
