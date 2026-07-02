import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DriveModule } from './drive/drive.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    PrismaModule, ProductsModule, AuthModule, DriveModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
