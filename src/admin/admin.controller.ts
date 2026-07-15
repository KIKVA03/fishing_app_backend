import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { Response } from 'express';
import { join } from 'path';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { catchUploadOptions } from '../catches/upload.config';
import { UpsertFishInfoDto } from '../fish-info/dto/fish-info.dto';
import { FishInfoService } from '../fish-info/fish-info.service';
import { SpotsService } from '../spots/spots.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CreateLakeDto, UpdateLakeDto } from './dto/lake.dto';

// JSON API under /api/admin/* — every route requires a logged-in admin.
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly fishInfoService: FishInfoService,
    private readonly spotsService: SpotsService,
  ) {}

  @Get('spots')
  spots() {
    return this.spotsService.adminList();
  }

  @Delete('spots/:id')
  deleteSpot(@Param('id') id: string) {
    return this.spotsService.adminRemove(id);
  }

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

  // Uploads a fish-species photo; returns { url } to put into fish_species[].image_uri.
  @Post('fish-image')
  @UseInterceptors(FileInterceptor('image', catchUploadOptions))
  uploadFishImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('ფოტო აუცილებელია');
    }
    return { url: this.adminService.buildUploadUrl(file.filename) };
  }

  // Creates or replaces the bait info for one fish species.
  @Post('fish-info')
  upsertFishInfo(@Body() dto: UpsertFishInfoDto) {
    return this.fishInfoService.upsert(dto);
  }

  @Delete('fish-info/:name')
  deleteFishInfo(@Param('name') name: string) {
    return this.fishInfoService.remove(name);
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
