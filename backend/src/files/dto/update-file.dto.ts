import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsPositive } from "class-validator";
import { Visibility } from "../../../generated/prisma/client";

export class UpdateFileDto{
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    remarks?: string;
    
    @IsEnum(Visibility)
    @IsOptional()
    visibility?: Visibility;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsArray()
    @IsUUID('4', {each: true})
    @IsOptional()
    tagIds?: string[];

}