import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DriveService } from '../drive/drive.service';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private driveService: DriveService
    ){}

    create(dto: CreateProductDto){
        return this.prisma.product.create({ data: dto});
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
        return this.driveService.listFilesInFolder(product.driveFolderId);
    }
}
