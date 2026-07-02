import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService){}

    @Get()
    findAll(){
        return this.categoriesService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CategoryDto){
        return this.categoriesService.create(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: CategoryDto){
        return this.categoriesService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string){
        return this.categoriesService.remove(id);
    }
}
