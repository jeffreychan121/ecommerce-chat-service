import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GuideService } from './guide.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { CheckStockDto } from './dto/check-stock.dto';
import { CheckPromoDto } from './dto/check-promo.dto';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('api/guide')
export class GuideController {
  private readonly logger = new Logger(GuideController.name);

  constructor(private readonly guideService: GuideService) {}

  /**
   * 商品搜索
   * Dify Chatflow HTTP Request 节点调用此接口搜索商品
   */
  @Post('search-products')
  @HttpCode(HttpStatus.OK)
  async searchProducts(@Body() dto: SearchProductsDto) {
    this.logger.log(`[GuideController] search-products: ${JSON.stringify(dto)}`);
    return this.guideService.searchProducts(dto);
  }

  /**
   * 库存查询
   */
  @Post('check-stock')
  @HttpCode(HttpStatus.OK)
  async checkStock(@Body() dto: CheckStockDto) {
    this.logger.log(`[GuideController] check-stock: ${JSON.stringify(dto)}`);
    return this.guideService.checkStock(dto);
  }

  /**
   * 活动查询
   */
  @Post('check-promo')
  @HttpCode(HttpStatus.OK)
  async checkPromo(@Body() dto: CheckPromoDto) {
    this.logger.log(`[GuideController] check-promo: ${JSON.stringify(dto)}`);
    return this.guideService.checkPromo(dto);
  }

  /**
   * 留资创建
   */
  @Post('create-lead')
  @HttpCode(HttpStatus.OK)
  async createLead(@Body() dto: CreateLeadDto) {
    this.logger.log(`[GuideController] create-lead: ${JSON.stringify(dto)}`);
    return this.guideService.createLead(dto);
  }
}