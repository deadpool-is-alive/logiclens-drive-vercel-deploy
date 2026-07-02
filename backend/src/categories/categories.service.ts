import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CategoryDto } from './dto/category.dto';


@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService){}

    findAll(){
        return this.prisma.category.findMany({ orderBy: {name: 'asc'}});
    }

    async create(dto: CategoryDto){
        try{
            return await this.prisma.category.create({ data: dto});
        } catch (error){
            if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'){
                throw new ConflictException('A category with this name already exists');
            }
            throw error;
        }
    }

    async update(id: string, dto: CategoryDto){
        await this.findOne(id);
        return this.prisma.category.update({ where: {id}, data: dto});
    }

    async remove(id: string){
        await this.findOne(id);
        return this.prisma.category.delete({ where: { id }});
    }

    private async findOne(id: string){
        const category = await this.prisma.category.findUnique({where : { id }});

        if(!category){
            throw new NotFoundException(`Category with id ${id} not found`);
        }

        return category;
    }
}
