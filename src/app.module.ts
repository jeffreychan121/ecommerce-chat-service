import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration';

import { DatabaseModule } from './infra/database/database.module';
import { ChatModule } from './modules/chat/chat.module';
import { SessionModule } from './modules/session/session.module';
import { MessageModule } from './modules/message/message.module';
import { DifyModule } from './modules/dify/dify.module';
import { HandoffModule } from './modules/handoff/handoff.module';
import { UserModule } from './modules/user/user.module';
import { StoreModule } from './modules/store/store.module';
import { OrderModule } from './modules/order/order.module';
import { IntentRouterModule } from './modules/intent-router/intent-router.module';
import { AgentModule } from './modules/agent/agent.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { GuideModule } from './modules/guide/guide.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    ChatModule,
    SessionModule,
    MessageModule,
    DifyModule,
    HandoffModule,
    UserModule,
    StoreModule,
    OrderModule,
    IntentRouterModule,
    AgentModule,
    MerchantModule,
    GuideModule,
  ],
})
export class AppModule {}