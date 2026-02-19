"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    app.enableCors({
        origin: ['http://localhost:4200', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Smart Contract Review API')
        .setDescription('AI-powered smart contract security auditing, gas optimization, and code review')
        .setVersion('1.0')
        .addTag('analysis', 'Contract analysis endpoints')
        .addTag('security', 'Security vulnerability detection')
        .addTag('optimization', 'Gas and bytecode optimization')
        .addTag('ai-review', 'AI-powered code review')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(3000);
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     🔍 Smart Contract Review Platform - API Server            ║
║     Running on: http://localhost:3000                         ║
║     API Docs:   http://localhost:3000/api/docs                ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map