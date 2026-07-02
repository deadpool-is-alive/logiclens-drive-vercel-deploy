import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { TagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
    constructor(private prisma: PrismaService){}

    findAll(){
        return this.prisma.tag.findMany({ orderBy: {name: 'asc'}});
    }

    async create(dto: TagDto){
        try{
            return await this.prisma.tag.create({data: dto});
        } catch(error){
            if( error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'){
                throw new ConflictException('A tag with this name already exists. ');
            }
            throw error;
        }
    }

    async remove(id: string){
        await this.findOne(id);
        return this.prisma.tag.delete({ where: { id }});
    }

    private async findOne(id: string){
        const tag = await this.prisma.tag.findUnique({ where : {id}});
        if(!tag){
            throw new NotFoundException(`Tag with id ${id} not found`);
        }
        return tag;
    }
}
