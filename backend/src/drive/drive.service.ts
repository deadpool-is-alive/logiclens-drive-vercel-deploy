import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3} from 'googleapis';


@Injectable()
export class DriveService implements OnModuleInit {
    private drive: drive_v3.Drive;

    constructor(private configService: ConfigService) {}

    onModuleInit() {
        const auth = new google.auth.GoogleAuth({
            keyFile: this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_PATH'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        this.drive = google.drive({ version: 'v3', auth });
    }

    // For flatten types
    // async listFilesInFolder(folderId: string){
    //     const response = await this.drive.files.list({
    //         q: `'${folderId}' in parents and trashed = false`,
    //         fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size)',
    //     });

    //     return response.data.files ?? [];
    // }

    private readonly FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

    async listFilesInFolder(folderId: string): Promise<drive_v3.Schema$File[]> {
        const response = await this.drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size)',
        });


        const items = response.data.files ?? [];
        const files: drive_v3.Schema$File[] = [];

        for(const item of items){
            if(item.mimeType === this.FOLDER_MIME_TYPE){
                const nestedFiles = await this.listFilesInFolder(item.id as string);
                files.push(...nestedFiles);
            } else {
                files.push(item);
            }
        }

        return files;
    }
}
