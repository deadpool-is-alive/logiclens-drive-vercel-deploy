import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DriveService } from '../drive/drive.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { ConfigModule } from '@nestjs/config';

@Injectable()
export class FilesService {
    constructor(
        private prisma: PrismaService,
        private driveService: DriveService
    ){}

    search(params: {query?: string; category? : string; tag? : string; productId?: string; isAuthenticated: boolean}){
        const { query, category, tag, productId, isAuthenticated } = params;

        return this.prisma.file.findMany({
            where: {
                AND: [
                    {deletedAt: null},
                    query? { name: {contains: query, mode: 'insensitive'}}: {},
                    category? {category: {name : {equals: category, mode: 'insensitive'}}} : {},
                    tag ? {fileTags: { some: {tag: {name: {equals: tag, mode: 'insensitive'}}}}} : {},
                    productId ? { productId } : {},
                    isAuthenticated? {} : {visibility: 'PUBLIC'},
                ],
            },
            include: {
                category: true,
                fileTags: {include: {tag: true}},
                product: {select: {id: true, name: true}},
            },
            orderBy: {modifiedTime: 'desc'},
        });
    }

    async softDelete(id: string){
        await this.findActiveFile(id);
        return this.prisma.file.update({ where: {id}, data: {deletedAt: new Date()}});
    }

    async restore(id: string){
        const file = await this.findAnyFile(id);
        if(!file.deletedAt){
            throw new ConflictException('This file is not deleted');
        }

        return this.prisma.file.update({ where: {id}, data: { deletedAt: null}});
    }

    listTrash(){
        return this.prisma.file.findMany({
            where: { deletedAt: {not: null}},
            orderBy: {deletedAt: 'desc'},
            include: { product: {select: {id: true, name: true}}},
        });
    }

    async getFileMeta(id: string){
        const file = await this.prisma.file.findUnique({where: { id }});
        if(!file){
            throw new NotFoundException(`File with id ${id} not found`);
        }
        return file;
    }

    async streamFile(id: string, isAuthenticated: boolean){
        const file = await this.findActiveFile(id);
        if(file.visibility === 'PRIVATE' && !isAuthenticated){
            throw new ForbiddenException('This file is private');
        }
        const stream = await this.driveService.getFileStream(file.driveFileId);
        return { stream, mimeType: file.mimeType, name: file.name};
    }

    async update(id: string, dto: UpdateFileDto){
        await this.findActiveFile(id);

        const { tagIds, ...fileData} = dto;

        return this.prisma.$transaction(async (tx) => {
            if(tagIds !== undefined){
                await tx.fileTag.deleteMany({ where: {fileId: id}});

                if(tagIds.length > 0){
                    await tx.fileTag.createMany({
                        data: tagIds.map((tagId) => ({ fileId: id, tagId })),
                    });
                }
            }

            return tx.file.update({
                where: {id},
                data: fileData,
                include: {category: true, fileTags: {include: {tag: true}}},
            });
        });
    }

    private async findActiveFile(id: string){
        const file = await this.prisma.file.findFirst({ where: { id, deletedAt: null }});

        if(!file){
            throw new NotFoundException(`File with id ${id} not found`);
        }
        return file;
    }

    private async findAnyFile(id: string){
        const file = await this.prisma.file.findUnique({ where: { id }});

        if(!file){
            throw new NotFoundException(`File with id ${id} not found`);
        }
        return file;
    }
}
