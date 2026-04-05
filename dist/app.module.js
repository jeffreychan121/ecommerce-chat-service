"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const configuration_1 = __importDefault(require("./config/configuration"));
const database_module_1 = require("./infra/database/database.module");
const chat_module_1 = require("./modules/chat/chat.module");
const session_module_1 = require("./modules/session/session.module");
const message_module_1 = require("./modules/message/message.module");
const dify_module_1 = require("./modules/dify/dify.module");
const handoff_module_1 = require("./modules/handoff/handoff.module");
const user_module_1 = require("./modules/user/user.module");
const store_module_1 = require("./modules/store/store.module");
const order_module_1 = require("./modules/order/order.module");
const intent_router_module_1 = require("./modules/intent-router/intent-router.module");
const agent_module_1 = require("./modules/agent/agent.module");
const merchant_module_1 = require("./modules/merchant/merchant.module");
const guide_module_1 = require("./modules/guide/guide.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            database_module_1.DatabaseModule,
            chat_module_1.ChatModule,
            session_module_1.SessionModule,
            message_module_1.MessageModule,
            dify_module_1.DifyModule,
            handoff_module_1.HandoffModule,
            user_module_1.UserModule,
            store_module_1.StoreModule,
            order_module_1.OrderModule,
            intent_router_module_1.IntentRouterModule,
            agent_module_1.AgentModule,
            merchant_module_1.MerchantModule,
            guide_module_1.GuideModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map