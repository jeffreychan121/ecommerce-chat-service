import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StoreType } from '@prisma/client';

export class SendMessageInputsDto {
  @IsString()
  @IsOptional()
  store_id?: string;

  @IsString()
  @IsOptional()
  store_type?: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  customer_id?: string;
}

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

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SendMessageInputsDto)
  inputs?: SendMessageInputsDto;
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

export class MessageResponseDto {
  id: string;
  sessionId: string;
  senderType: string;
  content: string;
  messageType: string;
  card?: any;  // 商品卡片数据
  createdAt: Date;
}

export class CreateOrResumeSessionResponseDto {
  sessionId: string;
  status: string;
  isNew: boolean;
  difyConversationId: string | null;
}