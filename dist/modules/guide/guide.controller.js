"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GuideController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuideController = void 0;
const common_1 = require("@nestjs/common");
const guide_service_1 = require("./guide.service");
const search_products_dto_1 = require("./dto/search-products.dto");
const check_stock_dto_1 = require("./dto/check-stock.dto");
const check_promo_dto_1 = require("./dto/check-promo.dto");
const create_lead_dto_1 = require("./dto/create-lead.dto");
let GuideController = GuideController_1 = class GuideController {
    constructor(guideService) {
        this.guideService = guideService;
        this.logger = new common_1.Logger(GuideController_1.name);
    }
    async searchProducts(dto) {
        this.logger.log(`[GuideController] search-products: ${JSON.stringify(dto)}`);
        return this.guideService.searchProducts(dto);
    }
    async checkStock(dto) {
        this.logger.log(`[GuideController] check-stock: ${JSON.stringify(dto)}`);
        return this.guideService.checkStock(dto);
    }
    async checkPromo(dto) {
        this.logger.log(`[GuideController] check-promo: ${JSON.stringify(dto)}`);
        return this.guideService.checkPromo(dto);
    }
    async createLead(dto) {
        this.logger.log(`[GuideController] create-lead: ${JSON.stringify(dto)}`);
        return this.guideService.createLead(dto);
    }
    async getLeads(storeId) {
        this.logger.log(`[GuideController] getLeads: storeId=${storeId}`);
        return this.guideService.getLeads(storeId);
    }
    async updateLeadStatus(id, status) {
        this.logger.log(`[GuideController] updateLeadStatus: ${id} -> ${status}`);
        return this.guideService.updateLeadStatus(id, status);
    }
};
exports.GuideController = GuideController;
__decorate([
    (0, common_1.Post)('search-products'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_products_dto_1.SearchProductsDto]),
    __metadata("design:returntype", Promise)
], GuideController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Post)('check-stock'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_stock_dto_1.CheckStockDto]),
    __metadata("design:returntype", Promise)
], GuideController.prototype, "checkStock", null);
__decorate([
    (0, common_1.Post)('check-promo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_promo_dto_1.CheckPromoDto]),
    __metadata("design:returntype", Promise)
], GuideController.prototype, "checkPromo", null);
__decorate([
    (0, common_1.Post)('create-lead'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", Promise)
], GuideController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)('leads'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GuideController.prototype, "getLeads", null);
__decorate([
    (0, common_1.Patch)('leads/:id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GuideController.prototype, "updateLeadStatus", null);
exports.GuideController = GuideController = GuideController_1 = __decorate([
    (0, common_1.Controller)('api/guide'),
    __metadata("design:paramtypes", [guide_service_1.GuideService])
], GuideController);
//# sourceMappingURL=guide.controller.js.map