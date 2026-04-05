"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayStatus = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["TO_BE_SHIPPED"] = "TO_BE_SHIPPED";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PayStatus;
(function (PayStatus) {
    PayStatus["UNPAID"] = "UNPAID";
    PayStatus["PAID"] = "PAID";
    PayStatus["REFUNDED"] = "REFUNDED";
})(PayStatus || (exports.PayStatus = PayStatus = {}));
//# sourceMappingURL=order.types.js.map