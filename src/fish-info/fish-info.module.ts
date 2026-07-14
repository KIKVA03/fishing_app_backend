import { Module } from '@nestjs/common';
import { FishInfoController } from './fish-info.controller';
import { FishInfoService } from './fish-info.service';

@Module({
  controllers: [FishInfoController],
  providers: [FishInfoService],
  exports: [FishInfoService], // AdminModule reuses it for upsert/delete
})
export class FishInfoModule {}
