import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class SearchProductsDto {
  @IsString()
  store_id: string;

  @IsEnum(['self', 'merchant'])
  store_type: 'self' | 'merchant';

  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  budget_min?: number;

  @IsOptional()
  @IsNumber()
  budget_max?: number;

  @IsOptional()
  @IsString()
  scene?: string;

  @IsOptional()
  @IsString()
  preference?: string;
}