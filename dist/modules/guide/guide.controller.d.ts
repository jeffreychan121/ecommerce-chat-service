import { GuideService } from './guide.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { CheckStockDto } from './dto/check-stock.dto';
import { CheckPromoDto } from './dto/check-promo.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
export declare class GuideController {
    private readonly guideService;
    private readonly logger;
    constructor(guideService: GuideService);
    searchProducts(dto: SearchProductsDto): Promise<import("./guide.types").SearchProductsResponse>;
    checkStock(dto: CheckStockDto): Promise<import("./guide.types").CheckStockResponse>;
    checkPromo(dto: CheckPromoDto): Promise<import("./guide.types").CheckPromoResponse>;
    createLead(dto: CreateLeadDto): Promise<import("./guide.types").CreateLeadResponse>;
    getLeads(storeId?: string): Promise<{
        storeId: string;
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        userPhone: string;
        quantity: number;
        skuId: string;
        skuName: string;
        price: number;
        intent: import("@prisma/client").$Enums.LeadIntent;
    }[]>;
    updateLeadStatus(id: string, status: string): Promise<{
        storeId: string;
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        userPhone: string;
        quantity: number;
        skuId: string;
        skuName: string;
        price: number;
        intent: import("@prisma/client").$Enums.LeadIntent;
    }>;
}
