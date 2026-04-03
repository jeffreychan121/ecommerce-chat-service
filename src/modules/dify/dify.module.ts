import { Module } from '@nestjs/common';
import { DifyClient } from './dify.client';
import { DifyService } from './dify.service';

@Module({
  providers: [DifyClient, DifyService],
  exports: [DifyClient, DifyService],
})
export class DifyModule {}