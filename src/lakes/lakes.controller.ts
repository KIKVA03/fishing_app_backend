import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CatchesService } from '../catches/catches.service';
import { CommentsService } from '../comments/comments.service';
import { LakesService } from './lakes.service';

@Controller('lakes')
export class LakesController {
  constructor(
    private readonly lakesService: LakesService,
    private readonly catchesService: CatchesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  findAll() {
    return this.lakesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lakesService.findOne(id);
  }

  // Public gallery of catches for a lake (replaces loadLakePhotos).
  @Get(':id/catches')
  catches(@Param('id', ParseIntPipe) id: number) {
    return this.catchesService.findByLake(id);
  }

  // Public comments for a lake (newest first).
  @Get(':id/comments')
  comments(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findByLake(id);
  }
}
