import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Response } from 'express';
import { join } from 'path';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CreateLakeDto, UpdateLakeDto } from './dto/lake.dto';

// JSON API under /api/admin/* — every route requires a logged-in admin.
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.adminService.deleteUser(admin.id, id);
  }

  @Get('catches')
  catches() {
    return this.adminService.listCatches();
  }

  @Delete('catches/:id')
  deleteCatch(@Param('id') id: string) {
    return this.adminService.deleteCatch(id);
  }

  @Get('comments')
  comments() {
    return this.adminService.listComments();
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.adminService.deleteComment(id);
  }

  @Post('lakes')
  createLake(@Body() dto: CreateLakeDto) {
    return this.adminService.createLake(dto);
  }

  @Patch('lakes/:id')
  updateLake(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLakeDto) {
    return this.adminService.updateLake(id, dto);
  }

  @Delete('lakes/:id')
  deleteLake(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteLake(id);
  }
}

// Serves the panel itself at http://<host>:4000/admin (route is excluded from
// the global /api prefix in main.ts). The HTML is a single self-contained file.
@Controller('admin')
export class AdminPageController {
  @Get()
  page(@Res() res: Response) {
    res.sendFile(join(process.cwd(), 'public', 'admin.html'));
  }
}
