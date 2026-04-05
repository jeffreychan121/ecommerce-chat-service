import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  user_id: string;

  @IsString()
  store_id: string;

  @IsString()
  sku_id: string;

  @IsEnum(['buy', 'consult', 'compare'])
  intent: 'buy' | 'consult' | 'compare';

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  remark?: string;
}