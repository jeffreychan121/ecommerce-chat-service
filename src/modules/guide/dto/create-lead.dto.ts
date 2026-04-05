import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  userPhone: string;

  @IsString()
  storeId: string;

  @IsString()
  skuId: string;

  @IsString()
  skuName: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsNumber()
  price: number;

  @IsEnum(['buy', 'consult', 'compare'])
  intent: 'buy' | 'consult' | 'compare';
}