import { Module } from '@nestjs/common';
import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';
import { PrismaService } from '../../infra/database/prisma.service';

@Module({
  controllers: [GuideController],
  providers: [GuideService, PrismaService],
  exports: [GuideService],
})
export class GuideModule {}