import { Module } from '@nestjs/common';
import { FishInfoModule } from '../fish-info/fish-info.module';
import { SpotsModule } from '../spots/spots.module';
import { AdminController, AdminPageController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [FishInfoModule, SpotsModule],
  controllers: [AdminController, AdminPageController],
  providers: [AdminService],
})
export class AdminModule {}
