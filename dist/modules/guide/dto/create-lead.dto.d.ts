export declare class CreateLeadDto {
    userPhone: string;
    storeId: string;
    skuId: string;
    skuName: string;
    quantity?: number;
    price: number;
    intent: 'buy' | 'consult' | 'compare';
}
