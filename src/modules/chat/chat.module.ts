import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { SessionModule } from '../session/session.module';
import { MessageModule } from '../message/message.module';
import { DifyModule } from '../dify/dify.module';
import { HandoffModule } from '../handoff/handoff.module';
import { UserModule } from '../user/user.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    forwardRef(() => SessionModule),
    forwardRef(() => MessageModule),
    forwardRef(() => DifyModule),
    forwardRef(() => HandoffModule),
    forwardRef(() => UserModule),
    forwardRef(() => StoreModule),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}