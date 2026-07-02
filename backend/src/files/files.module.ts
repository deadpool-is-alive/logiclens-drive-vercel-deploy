import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DriveModule } from '../drive/drive.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DriveModule, AuthModule],
  controllers: [FilesController],
  providers: [FilesService]
})
export class FilesModule {}
