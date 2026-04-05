import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private userService: UserService) {}

  // 手机号登录（自动注册）
  @Post('login')
  async login(@Body() body: { phone: string }) {
    this.logger.log(`Login request for phone: ${body.phone}`);
    const user = await this.userService.findOrCreateByPhone(body.phone);
    return {
      userId: user.id,
      phone: user.phone,
    };
  }

  // 获取用户信息
  @Get('user/:phone')
  async getUserByPhone(@Body() body: { phone: string }) {
    const user = await this.userService.findByPhone(body.phone);
    if (!user) {
      return null;
    }
    return {
      userId: user.id,
      phone: user.phone,
    };
  }
}