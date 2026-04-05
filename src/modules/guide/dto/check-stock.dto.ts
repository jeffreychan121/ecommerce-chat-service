import { IsString, IsArray } from 'class-validator';

export class CheckStockDto {
  @IsString()
  store_id: string;

  @IsArray()
  @IsString({ each: true })
  sku_ids: string[];
}