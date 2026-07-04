import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DriveService } from '../drive/drive.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private driveService: DriveService
    ){}

    async create(dto: CreateProductDto){
        try{
            return await this.prisma.product.create({ data: dto}); 
        }
        catch (error){
            if( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'){
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
        return this.prisma.product.update({ where: {id}, data: dto});
    }

    async remove(id: string){
        await this.findOne(id);
        return this.prisma.product.delete({ where: {id}});
    }

    async findFiles(id: string){
        const product = await this.findOne(id);
        // return this.driveService.listFilesInFolder(product.driveFolderId);
        return this.prisma.file.findMany({
            where: { productId: id, deletedAt: null },
            include: {category: true, fileTags: {include: {tag: true }}},
            orderBy: {modifiedTime: 'desc'},
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
