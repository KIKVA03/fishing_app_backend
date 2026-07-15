import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CatchesModule } from './catches/catches.module';
import { CommentsModule } from './comments/comments.module';
import { FishInfoModule } from './fish-info/fish-info.module';
import { HealthModule } from './health/health.module';
import { LakesModule } from './lakes/lakes.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpotsModule } from './spots/spots.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LakesModule,
    CatchesModule,
    CommentsModule,
    FishInfoModule,
    SpotsModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
