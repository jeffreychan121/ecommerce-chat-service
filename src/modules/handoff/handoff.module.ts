import { Module, forwardRef } from '@nestjs/common';
import { HandoffService } from './handoff.service';
import { HandoffController } from './handoff.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [forwardRef(() => SessionModule)],
  providers: [HandoffService],
  controllers: [HandoffController],
  exports: [HandoffService],
})
export class HandoffModule {}