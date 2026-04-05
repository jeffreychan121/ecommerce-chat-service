import { Module, forwardRef } from '@nestjs/common';
import { HandoffService } from './handoff.service';
import { HandoffController, AgentController } from './handoff.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [forwardRef(() => SessionModule)],
  providers: [HandoffService],
  controllers: [HandoffController, AgentController],
  exports: [HandoffService],
})
export class HandoffModule {}