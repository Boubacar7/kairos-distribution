import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ProductStatus, Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  list(@Query('category') category?: string, @Query('search') search?: string, @Query('status') status?: ProductStatus) {
    return this.products.list({ category, search, status });
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) { return this.products.bySlug(slug); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateProductDto) { return this.products.create(dto); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.products.remove(id); }
}
