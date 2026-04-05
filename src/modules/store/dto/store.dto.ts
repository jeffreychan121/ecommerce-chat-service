import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { StoreType } from '@prisma/client';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(StoreType)
  storeType: StoreType;
}

export class StoreResponseDto {
  id: string;
  name: string;
  storeType: StoreType;
  createdAt: Date;
  updatedAt: Date;
}