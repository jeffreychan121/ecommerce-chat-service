import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { StoreModule } from '../store/store.module';
import { DifyModule } from '../dify/dify.module';

@Module({
  imports: [StoreModule, DifyModule],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
