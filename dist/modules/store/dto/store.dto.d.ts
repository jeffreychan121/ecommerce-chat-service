import { StoreType } from '@prisma/client';
export declare class CreateStoreDto {
    name: string;
    storeType: StoreType;
}
export declare class StoreResponseDto {
    id: string;
    name: string;
    storeType: StoreType;
    createdAt: Date;
    updatedAt: Date;
}
