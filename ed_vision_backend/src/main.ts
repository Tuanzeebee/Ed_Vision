import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // create app with reduced logger (only warnings/errors)
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and backend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // Informative startup message
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
