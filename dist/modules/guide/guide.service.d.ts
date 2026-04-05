import { PrismaService } from '../../infra/database/prisma.service';
import { SearchProductsRequest, SearchProductsResponse, CheckStockRequest, CheckStockResponse, CheckPromoRequest, CheckPromoResponse, CreateLeadRequest, CreateLeadResponse } from './guide.types';
import { Lead, LeadStatus } from '@prisma/client';
export declare class GuideService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    searchProducts(req: SearchProductsRequest): Promise<SearchProductsResponse>;
    checkStock(req: CheckStockRequest): Promise<CheckStockResponse>;
    checkPromo(req: CheckPromoRequest): Promise<CheckPromoResponse>;
    createLead(req: CreateLeadRequest): Promise<CreateLeadResponse>;
    getLeads(storeId?: string): Promise<Lead[]>;
    updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead>;
}
