import { Controller, Get, Patch, Delete, Post, Query, Param, Res, Req, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateFileDto } from './dto/update-file.dto';
import { FilesService } from './files.service';
import { Response } from 'express';
import { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { useContainer } from 'class-validator';

@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService){}

    @UseGuards(OptionalJwtAuthGuard)
    @Get('search')
    search(
        @Req() req: Request,
        @Query('query') query?: string,
        @Query('category') category?: string,
        @Query('tag') tag?: string,
        @Query('productId') productId?: string,
    ){
        return this.filesService.search({query, category, tag, productId, isAuthenticated: !! req.user});
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/preview')
    async preview(@Param('id') id: string,@Req() req: Request, @Res() res: Response){
        const {stream, mimeType } = await this.filesService.streamFile(id, !!req.user);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', 'inline');
        stream.pipe(res);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/download')
    async download(@Param('id') id: string,@Req() req: Request, @Res() res: Response){
        const {stream, mimeType, name} = await this.filesService.streamFile(id, !!req.user);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachement; filename="${name}"`);
        stream.pipe(res);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFileDto){
        return this.filesService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    softDelete(@Param('id') id: string){
        return this.filesService.softDelete(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/restore')
    restore(@Param('id') id: string){
        return this.filesService.restore(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('trash')
    listTrash(){
        return this.filesService.listTrash();
    }

}
