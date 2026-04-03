"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port') || 3000;
    await app.listen(port);
    logger.log(`Mall Chat Service started on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map