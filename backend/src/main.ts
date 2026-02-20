import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for large multi-file contracts
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000', 'http://localhost:4201'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Smart Contract Review API')
    .setDescription('AI-powered smart contract security auditing, gas optimization, and code review')
    .setVersion('1.0')
    .addTag('analysis', 'Contract analysis endpoints')
    .addTag('security', 'Security vulnerability detection')
    .addTag('optimization', 'Gas and bytecode optimization')
    .addTag('ai-review', 'AI-powered code review')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

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
