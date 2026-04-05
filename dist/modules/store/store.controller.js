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
var StoreController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreController = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("./store.service");
const store_dto_1 = require("./dto/store.dto");
let StoreController = StoreController_1 = class StoreController {
    constructor(storeService) {
        this.storeService = storeService;
        this.logger = new common_1.Logger(StoreController_1.name);
    }
    async getStores() {
        this.logger.log('Getting all stores');
        return this.storeService.findAll();
    }
    async createStore(dto) {
        this.logger.log(`Creating store: ${dto.name}`);
        return this.storeService.createStore(dto.name, dto.storeType);
    }
    async deleteStore(id) {
        this.logger.log(`Deleting store: ${id}`);
        return this.storeService.deleteStore(id);
    }
};
exports.StoreController = StoreController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "getStores", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [store_dto_1.CreateStoreDto]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "createStore", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "deleteStore", null);
exports.StoreController = StoreController = StoreController_1 = __decorate([
    (0, common_1.Controller)('api/stores'),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], StoreController);
//# sourceMappingURL=store.controller.js.map