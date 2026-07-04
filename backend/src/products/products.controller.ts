import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createProductDto: CreateProductDto){
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(){
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this.productsService.findOne(id);
    }

    @Get(':id/thumbnail')
    async getThumbnail(@Param('id') id: string) {
        return this.productsService.getProductThumbnail(id);
    }

    @Get(':id/files')
    async findFiles(@Param('id') id: string){
        return this.productsService.findFiles(id);
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto){
        return this.productsService.update(id, updateProductDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string){
        return this.productsService.remove(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/sync')
    syncFiles(@Param('id') id: string){
        return this.productsService.syncFiles(id);
    }
}
