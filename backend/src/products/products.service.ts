import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DriveService } from '../drive/drive.service';
import { Prisma } from '../../generated/prisma/client';
import { UpdateFileDto } from '../files/dto/update-file.dto';
import { Express } from 'express';

@Injectable()
export class ProductsService {

    private syncLocks = new Map<string, Promise<{ status: string; filesFound: number; filesCreated: number; filesUpdated: number }>>();
    constructor(
        private prisma: PrismaService,
        private driveService: DriveService
    ){}

        // Replace this exact method in product.service.ts
    private extractFolderId(input: string): string {
        if (!input) throw new BadRequestException('Google Drive link is required');

        const trimmed = input.trim();

        // 1. If the user just pasted the raw ID itself (e.g., "1aBcDeFg... ")
        if (/^[0-9a-zA-Z_-]{25,}$/.test(trimmed)) {
            return trimmed;
        }

        try {
            const url = new URL(trimmed);
            
            // 2. Check for ?id= or &id= parameter (handles ?usp=sharing links perfectly)
            const idFromParams = url.searchParams.get('id');
            if (idFromParams && /^[0-9a-zA-Z_-]{25,}$/.test(idFromParams)) {
                return idFromParams;
            }

            // 3. Check pathname for standard formats like /folders/... or /file/d/...
            const pathRegex = /\/(?:folders|file\/d|open)\/([0-9a-zA-Z_-]{25,})/;
            const pathMatch = url.pathname.match(pathRegex);
            if (pathMatch && pathMatch[1]) {
                return pathMatch[1];
            }
            
        } catch (error) {
            // Not a valid URL structure, will fall through to final fallback
        }

        // 4. Final Fallback: Just find any long alphanumeric string in the pasted text
        const fallbackMatch = trimmed.match(/([0-9a-zA-Z_-]{25,})/);
        if (fallbackMatch && fallbackMatch[1]) {
            return fallbackMatch[1];
        }

        throw new BadRequestException('Could not extract a valid Google Drive ID from the provided link');
    }

    async create(dto: CreateProductDto) {
        const driveFolderId = this.extractFolderId(dto.driveFolderLink);
        try {
        return await this.prisma.product.create({
            data: { name: dto.name, description: dto.description, driveFolderId },
        });
        } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ConflictException('A product with this Drive folder is already registered');
        }
        throw error;
        }
    }

    findAll(){
        return this.prisma.product.findMany({
            orderBy: { createdAt: 'desc'}
        });
    }

    async findOne(id: string){
        const product = await this.prisma.product.findUnique({ where: { id }});
        if (!product) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }
        return product;
    }

    async update(id: string, dto: UpdateProductDto){
        await this.findOne(id);
        const driveFolderId = this.extractFolderId(dto.driveFolderLink);
        return this.prisma.product.update({ where: {id}, data: { name: dto.name, description: dto.description, driveFolderId }});
    }

    async remove(id: string){
        await this.findOne(id);
        return this.prisma.product.delete({ where: {id}});
    }

    async findFiles(productId: string, parentId?: string) {
        await this.findOne(productId); // Ensure product exists

        return this.prisma.file.findMany({
            where: {
                productId: productId,
                deletedAt: null,
                // If parentId is provided, get its children. If null/undefined, get root files.
                parentId: parentId || null, 
            },
            include: {
                category: true, 
                fileTags: { include: { tag: true } }
            },
            // CRITICAL: Sort folders first (true=1), then alphabetical by name
            orderBy: [
                { isFolder: 'desc' }, 
                { name: 'asc' }
            ]
        });
    }

    async syncFiles(productId: string){
        const product = await this.findOne(productId);

        const syncRecord = await this.prisma.syncHistory.create({
            data: { productId, filesFound: 0, filesCreated: 0, filesUpdated: 0, status: 'IN_PROGRESS'},
        });

        let filesCreated = 0;
        let filesUpdated = 0;

        try{
            const driveFiles = await this.driveService.listFilesInFolder(product.driveFolderId);

            for(const driveFile of driveFiles){
                const existing = await this.prisma.file.findUnique({
                    where: { driveFileId: driveFile.id as string },
                });

                const data = {
                    name: driveFile.name as string,
                    mimeType: driveFile.mimeType as string,
                    webViewLink: driveFile.webViewLink as string,
                    size: driveFile.size ? BigInt(driveFile.size) : null,
                    modifiedTime: new Date(driveFile.modifiedTime as string),
                };

                if(existing){
                    await this.prisma.file.update({ where: {id: existing.id }, data});
                    filesUpdated++;
                } else {
                    await this.prisma.file.create({data : {...data, driveFileId: driveFile.id as string, productId}, });
                    filesCreated++;
                }
            } 

            await this.prisma.syncHistory.update({
                where: { id: syncRecord.id },
                data: {
                    status: 'SUCCESS',
                    filesFound: driveFiles.length,
                    filesCreated,
                    filesUpdated,
                    finishedAt: new Date(),
                },
            });

            return { status: 'SUCCESS', filesFound: driveFiles.length, filesCreated, filesUpdated };

        } catch (error){
            await this.prisma.syncHistory.update({
                where: {id: syncRecord.id},
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    finishedAt: new Date(),
                },
            });
            throw error;
        }
    }

     /**
     * CHUNK 2: Recursive Hierarchy Sync
     * Maps Google Drive parent-child relationships into the database.
     */
    async syncHierarchy(productId: string) {
        const inFlight = this.syncLocks.get(productId);
        if (inFlight) {
            return inFlight;
        }

        const runPromise = this.runSyncHierarchy(productId).finally(() => {
            this.syncLocks.delete(productId);
        });

        this.syncLocks.set(productId, runPromise);
        return runPromise;
    }

    async runSyncHierarchy(productId: string) {
        const product = await this.findOne(productId);

        // We must fetch FLAT, including nested folders, along with their 'parents'
        // Note: You need to change DriveService to recursively get ALL files in subfolders too.
        // For now, assuming listFilesInFolder gets everything as it did before.
        const driveFiles = await this.driveService.listAllFilesRecursive(product.driveFolderId);

        const driveIdToUuidMap = new Map<string, string>();
        let filesCreated = 0;
        let filesUpdated = 0;

        // STEP 1: Process all FOLDERS first to establish UUIDs for parent mapping
        const folders = driveFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
        for (const folder of folders) {
            const driveFolderId = folder.id as string;
            
            // Check permissions
            const driveRole = await this.driveService.getMyPermission(driveFolderId);

            const existing = await this.prisma.file.findUnique({
                where: { driveFileId: driveFolderId }
            });
            const title = folder.name.replace(/\.[^/.]+$/, "");
            const data = {
                name: folder.name as string,
                title: existing?.title ?? title,  
                mimeType: folder.mimeType as string,
                webViewLink: folder.webViewLink as string,
                modifiedTime: new Date(folder.modifiedTime as string),
                isFolder: true,
                driveRole: driveRole,
                parentId: null as string | null, // Will be updated in step 2 if nested
            };

            if (existing) {
                await this.prisma.file.update({ where: { id: existing.id }, data });
                driveIdToUuidMap.set(driveFolderId, existing.id);
                filesUpdated++;
            } else {
                const created = await this.prisma.file.create({
                    data: { ...data, driveFileId: driveFolderId, productId }
                });
                driveIdToUuidMap.set(driveFolderId, created.id);
                filesCreated++;
            }
        }

        // STEP 2: Process all FILES and link them to their parent folders
        const files = driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
        for (const file of files) {
            const driveFileId = file.id as string;
            const driveRole = await this.driveService.getMyPermission(driveFileId);

            // Determine parent UUID using the map we just built
            // file.parents[0] contains the Drive ID of the parent folder
            const parentDriveId = file.parents?.[0];
            const parentUuid = parentDriveId ? driveIdToUuidMap.get(parentDriveId) : null;

            const existing = await this.prisma.file.findUnique({
                where: { driveFileId }
            });
            const title = file.name.replace(/\.[^/.]+$/, "");
            const data = {
                name: file.name as string,
                title: existing?.title ?? title,
                mimeType: file.mimeType as string,
                webViewLink: file.webViewLink as string,
                size: file.size ? BigInt(file.size) : null,
                modifiedTime: new Date(file.modifiedTime as string),
                driveRole: driveRole,
                isFolder: false,
                parentId: parentUuid, // Apply the mapped UUID
            };

            if (existing) {
                await this.prisma.file.update({ where: { id: existing.id }, data });
                filesUpdated++;
            } else {
                await this.prisma.file.create({
                    data: { ...data, driveFileId, productId }
                });
                filesCreated++;
            }
        }

        // STEP 3: Update nested folder parents (if a folder is inside another folder)
        for (const folder of folders) {
            const parentDriveId = folder.parents?.[0];
            if (parentDriveId && driveIdToUuidMap.has(parentDriveId)) {
                const folderUuid = driveIdToUuidMap.get(folder.id as string);
                if (folderUuid) {
                    await this.prisma.file.update({
                        where: { id: folderUuid },
                        data: { parentId: driveIdToUuidMap.get(parentDriveId) }
                    });
                }
            }
        }

        return { status: 'SUCCESS', filesFound: driveFiles.length, filesCreated, filesUpdated };
    }

    async uploadFilesToProduct(productId: string, files: Express.Multer.File[]) {
        const product = await this.findOne(productId);

        if (!Array.isArray(files)) {
            throw new BadRequestException('No files were found in the upload request. Check your form-data key.');
        }

        const uploadedFiles = [];
        console.log(files);
        console.log(Array.isArray(files));
        console.log(files.length);
        
        for (const file of files) {
            try {
                // Upload file to Google Drive
                const driveResponse = await this.driveService.uploadFile(
                    product.driveFolderId, 
                    file.buffer, 
                    file.mimetype, 
                    file.originalname
                );

                // Save metadata to database
                const newFile = await this.prisma.file.create({
                    data: {
                        driveFileId: driveResponse.id,
                        name: file.originalname,
                        mimeType: file.mimetype,
                        webViewLink: driveResponse.webViewLink,
                        size: BigInt(file.size),
                        modifiedTime: new Date(),
                        productId: productId,
                    }
                });

                uploadedFiles.push(newFile);
            } catch (error) {
                // If one file fails to upload, log it but continue with the rest
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Failed to upload file ${file.originalname}:`, errorMessage);
            }
        }

        return uploadedFiles;
    }

     async getProductThumbnail(productId: string) {
        // 1. Look for specific standard names
        const coverFile = await this.prisma.file.findFirst({
            where: {
                productId: productId,
                deletedAt: null,
                name: {
                    in: ['cover.jpg', 'cover.png', 'thumbnail.jpg', 'thumbnail.png', 'folder.jpg']
                }
            },
            select: { id: true, driveFileId: true } // <--- ADDED driveFileId
        });

        // console.log("Found cover image");

        if (coverFile) return coverFile;

        // 2. Fallback: Find the first image in the folder
        const firstImage = await this.prisma.file.findFirst({
            where: {
                productId: productId,
                deletedAt: null,
                mimeType: { startsWith: 'image/' }
            },
            select: { id: true, driveFileId: true }, // <--- ADDED driveFileId
            orderBy: { createdAt: 'asc' }
        });

        return firstImage; // Returns { id: "uuid" } or null
    }

     
}
