import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [UserService],
  controllers: [AuthController],
  exports: [UserService],
})
export class UserModule {}
