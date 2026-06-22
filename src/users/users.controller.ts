import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatchesService } from '../catches/catches.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly catchesService: CatchesService,
  ) {}

  // Update the signed-in user's profile (currently just avatar).
  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  // All catches by the signed-in user (replaces loadAllUserPhotos).
  @Get('users/me/catches')
  @UseGuards(JwtAuthGuard)
  myCatches(@CurrentUser() user: User) {
    return this.catchesService.findByUser(user.id);
  }

  // Public leaderboard, sorted by score desc.
  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.usersService.leaderboard(Number.isFinite(parsed) ? parsed : 100);
  }
}
