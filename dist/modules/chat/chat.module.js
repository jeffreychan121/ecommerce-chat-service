"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const chat_controller_1 = require("./chat.controller");
const chat_gateway_1 = require("./chat.gateway");
const session_module_1 = require("../session/session.module");
const message_module_1 = require("../message/message.module");
const dify_module_1 = require("../dify/dify.module");
const handoff_module_1 = require("../handoff/handoff.module");
const user_module_1 = require("../user/user.module");
const store_module_1 = require("../store/store.module");
const order_module_1 = require("../order/order.module");
const intent_router_module_1 = require("../intent-router/intent-router.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => session_module_1.SessionModule),
            (0, common_1.forwardRef)(() => message_module_1.MessageModule),
            (0, common_1.forwardRef)(() => dify_module_1.DifyModule),
            (0, common_1.forwardRef)(() => handoff_module_1.HandoffModule),
            (0, common_1.forwardRef)(() => user_module_1.UserModule),
            (0, common_1.forwardRef)(() => store_module_1.StoreModule),
            (0, common_1.forwardRef)(() => order_module_1.OrderModule),
            (0, common_1.forwardRef)(() => intent_router_module_1.IntentRouterModule),
        ],
        providers: [chat_service_1.ChatService, chat_gateway_1.ChatGateway],
        controllers: [chat_controller_1.ChatController],
        exports: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map