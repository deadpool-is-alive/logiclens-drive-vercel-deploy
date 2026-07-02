import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DriveService } from './drive/drive.service';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly driveService: DriveService,) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get('test-drive')
  // testDrive(@Query('folderId') folderId: string){
  //   return this.driveService.listFilesInFolder(folderId);
  // }
}
