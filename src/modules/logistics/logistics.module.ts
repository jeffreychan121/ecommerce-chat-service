import { Module } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}