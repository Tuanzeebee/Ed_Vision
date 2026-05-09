import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';
import { getTrustedProxySetting } from './common/config/network.config';
import { RedisIoAdapter } from './websocket/redis-io.adapter';

async function bootstrap() {
  // Disable global console.log, console.debug and console.warn if necessary
  // Keep original to print the startup message
  const originalConsoleLog = console.log;
  console.log = () => {};
  console.debug = () => {};

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev and other local
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Create directories if they don't exist
  const uploadsDir = join(process.cwd(), 'uploads');
  const passagesDir = join(uploadsDir, 'audio', 'passages');
  const speakingDir = join(uploadsDir, 'audio', 'speaking');

  [uploadsDir, join(uploadsDir, 'audio'), passagesDir, speakingDir].forEach(
    (dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    },
  );

  // Serve static audio files (legacy prefix)
  app.useStaticAssets(join(uploadsDir, 'audio'), {
    prefix: '/audio',
  });

  // Serve the entire uploads directory (images, audio, certificates, etc.)
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
    setHeaders: (res) => {
      // Cache static media aggressively; file names are content-hashed/unique.
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  });

  app.set('trust proxy', getTrustedProxySetting());

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Changed to false to be more flexible with dynamic IELTS payloads
      transform: true,
    }),
  );

  // Body parser
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  originalConsoleLog(`Application is running on: http://${host}:${port}`);
}
bootstrap();
