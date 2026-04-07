import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5175'],
  });

  await app.listen(3000);
}
bootstrap();