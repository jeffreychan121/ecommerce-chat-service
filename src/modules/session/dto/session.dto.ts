import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { StoreType } from '@prisma/client';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsEnum(StoreType)
  storeType: StoreType;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsString()
  @IsOptional()
  customerId?: string;
}

export class SessionResponseDto {
  id: string;
  userId: string;
  storeId: string;
  storeType: StoreType;
  channel: string;
  difyConversationId: string | null;
  status: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}