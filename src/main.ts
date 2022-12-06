import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // DTO, class Validationの有効化
  // whitelist:true→DTOに含まれないパラメータを省く
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // BE←FEのアクセス許可
  app.enableCors({
    // cookieベースでの通信を有効化
    credentials: true,
    origin: ['http://localhost:3000'],
  });
  // middlewareでcookieの解析を有効化
  app.use(cookieParser());
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      },
      value: (req: Request) => {
        return req.header('csrf-token');
      },
    }),
  );
  await app.listen(process.env.port || 3005);
}
bootstrap();
