import { Module } from '@nestjs/common';
import { FishInfoModule } from '../fish-info/fish-info.module';
import { AdminController, AdminPageController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [FishInfoModule],
  controllers: [AdminController, AdminPageController],
  providers: [AdminService],
})
export class AdminModule {}
