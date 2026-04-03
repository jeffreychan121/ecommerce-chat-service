import { IsString, IsOptional } from 'class-validator';

export class HandoffRequestDto {
  @IsString()
  @IsOptional()
  reason?: string;
}