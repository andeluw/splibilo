import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { SnakeToCamelBodyPipe } from './common/pipes/snake-to-camel-body.pipe';
import { SnakeCaseResponseInterceptor } from './common/interceptors/snake-case-response.interceptor';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new SnakeCaseResponseInterceptor(),
  );
  app.useGlobalPipes(
    new SnakeToCamelBodyPipe(),
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.setGlobalPrefix('api');
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.enableCors({
    origin: '*',
  })
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
