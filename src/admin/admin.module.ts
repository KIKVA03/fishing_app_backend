import { Module } from '@nestjs/common';
import { AdminController, AdminPageController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, AdminPageController],
  providers: [AdminService],
})
export class AdminModule {}
