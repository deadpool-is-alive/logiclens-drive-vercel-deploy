import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthModule } from '../auth/auth.module';
import { DriveModule } from '../drive/drive.module';

@Module({
  imports: [AuthModule, DriveModule],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
