import { Controller, Get, Post, Delete, Body, Param, Logger } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/store.dto';

@Controller('api/stores')
export class StoreController {
  private readonly logger = new Logger(StoreController.name);

  constructor(private storeService: StoreService) {}

  // 获取店铺列表
  @Get()
  async getStores() {
    this.logger.log('Getting all stores');
    return this.storeService.findAll();
  }

  // 创建店铺
  @Post()
  async createStore(@Body() dto: CreateStoreDto) {
    this.logger.log(`Creating store: ${dto.name}`);
    return this.storeService.createStore(dto.name, dto.storeType);
  }

  // 删除店铺
  @Delete(':id')
  async deleteStore(@Param('id') id: string) {
    this.logger.log(`Deleting store: ${id}`);
    return this.storeService.deleteStore(id);
  }
}