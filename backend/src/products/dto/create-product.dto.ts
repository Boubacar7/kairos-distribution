import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class VariantDto {
  @IsString() name: string;
  @IsOptional() attributes?: any;
  @IsOptional() @IsInt() priceDelta?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
}

export class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsString() category: string;
  @IsInt() @Min(0) price: number;
  @IsOptional() @IsInt() @Min(0) promo?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @IsOptional() @IsArray() @Type(() => VariantDto) variants?: VariantDto[];
}
