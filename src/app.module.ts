import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { LogisticsModule } from './modules/logistics/logistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    ChatModule,
    SessionModule,
    MessageModule,
    DifyModule,
    HandoffModule,
    UserModule,
    StoreModule,
    OrderModule,
    LogisticsModule,
  ],
})
export class AppModule {}