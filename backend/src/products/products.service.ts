import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProductStatus } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async list(query: { category?: string; search?: string; status?: ProductStatus }) {
    const where: Prisma.ProductWhereInput = {
      status: query.status ?? ProductStatus.PUBLISHED,
      ...(query.category ? { category: query.category } : {}),
      ...(query.search ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    return this.prisma.product.findMany({ where, include: { variants: true }, orderBy: { createdAt: 'desc' } });
  }

  async bySlug(slug: string) {
    const p = await this.prisma.product.findUnique({ where: { slug }, include: { variants: true, reviews: { where: { status: 'APPROVED' } } } });
    if (!p) throw new NotFoundException('Produit introuvable');
    return p;
  }

  async byId(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!p) throw new NotFoundException('Produit introuvable');
    return p;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || this.slugify(dto.name);
    return this.prisma.product.create({
      data: {
        slug, name: dto.name, description: dto.description, category: dto.category,
        price: dto.price, promo: dto.promo ?? 0, stock: dto.stock ?? 0, image: dto.image,
        status: dto.status ?? ProductStatus.PUBLISHED,
        variants: dto.variants?.length ? { create: dto.variants.map(v => ({ name: v.name, attributes: v.attributes, priceDelta: v.priceDelta ?? 0, stock: v.stock ?? 0 })) } : undefined,
      },
      include: { variants: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.byId(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        slug: dto.slug, name: dto.name, description: dto.description, category: dto.category,
        price: dto.price, promo: dto.promo, stock: dto.stock, image: dto.image, status: dto.status,
      },
      include: { variants: true },
    });
  }

  async remove(id: string) {
    await this.byId(id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  private slugify(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
