import { Module } from '@nestjs/common';
import { CatchesModule } from '../catches/catches.module';
import { CommentsModule } from '../comments/comments.module';
import { LakesController } from './lakes.controller';
import { LakesService } from './lakes.service';

@Module({
  imports: [CatchesModule, CommentsModule],
  controllers: [LakesController],
  providers: [LakesService],
})
export class LakesModule {}
