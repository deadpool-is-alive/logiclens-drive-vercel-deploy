import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagDto } from './dto/tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService){}

    @Get()
    findAll(){
        return this.tagsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: TagDto){
        return this.tagsService.create(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    remove(@Param('id') id: string){
        return this.tagsService.remove(id);
    }
}
