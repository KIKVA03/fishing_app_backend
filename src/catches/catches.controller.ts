import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatchesService } from './catches.service';
import { catchUploadOptions } from './upload.config';

@Controller('catches')
@UseGuards(JwtAuthGuard)
export class CatchesController {
  constructor(private readonly catchesService: CatchesService) {}

  // Multipart form-data: field "image" (file) + field "lakeId" (number).
  // The author (username/avatar) is taken from the auth token, not the body.
  @Post()
  @UseInterceptors(FileInterceptor('image', catchUploadOptions))
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('lakeId') lakeIdRaw: string,
  ) {
    const lakeId = Number(lakeIdRaw);
    if (!Number.isInteger(lakeId)) {
      throw new BadRequestException('lakeId არასწორია');
    }
    return this.catchesService.create(user.id, lakeId, file);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.catchesService.remove(user.id, id);
  }
}
