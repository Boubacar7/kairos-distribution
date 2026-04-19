import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('Panier vide');

    const productIds = dto.items.map(i => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, include: { variants: true } });
    if (products.length !== productIds.length) throw new BadRequestException('Produit introuvable');

    let subtotal = 0;
    const items = dto.items.map(it => {
      const p = products.find(x => x.id === it.productId)!;
      const variant = it.variantId ? p.variants.find(v => v.id === it.variantId) : null;
      if (variant && variant.stock < it.qty) throw new BadRequestException(`Stock insuffisant pour ${p.name} / ${variant.name}`);
      if (!variant && p.stock < it.qty) throw new BadRequestException(`Stock insuffisant pour ${p.name}`);
      const effective = Math.round(p.price * (1 - (p.promo || 0) / 100)) + (variant?.priceDelta || 0);
      const lineTotal = effective * it.qty;
      subtotal += lineTotal;
      return { productId: p.id, variantId: variant?.id ?? null, name: p.name + (variant ? ' — ' + variant.name : ''), qty: it.qty, unitPrice: effective, lineTotal };
    });

    let delivery = 0;
    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { id: dto.zoneId } });
      if (zone) delivery = zone.fee;
    }

    let discount = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.couponCode.toUpperCase() } });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.maxUses || coupon.used < coupon.maxUses) && subtotal >= (coupon.minAmount || 0)) {
        if (coupon.type === 'PERCENT') discount = Math.round(subtotal * coupon.value / 100);
        else if (coupon.type === 'FIXED') discount = coupon.value;
        else if (coupon.type === 'FREE_SHIPPING') delivery = 0;
      }
    }

    const total = Math.max(0, subtotal - discount + delivery);
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({ where: { createdAt: { gte: new Date(year, 0, 1) } } });
    const id = `KD-${year}-${String(count + 1).padStart(4, '0')}`;
    const trackingNumber = `KDTRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          id, trackingNumber, paymentMethod: dto.paymentMethod, paymentStatus: PaymentStatus.PENDING,
          subtotal, discount, delivery, total, couponCode: dto.couponCode, zoneId: dto.zoneId, notes: dto.notes,
          customerFirst: dto.customer.firstName, customerLast: dto.customer.lastName,
          customerPhone: dto.customer.phone, customerEmail: dto.customer.email,
          customerCity: dto.customer.city, customerCountry: dto.customer.country, customerAddress: dto.customer.address,
          history: [{ status: 'NEW', at: new Date().toISOString() }] as unknown as Prisma.JsonArray,
          items: { create: items },
        },
        include: { items: true },
      });
      for (const it of items) {
        if (it.variantId) await tx.variant.update({ where: { id: it.variantId }, data: { stock: { decrement: it.qty } } });
        else await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
      }
      if (dto.couponCode) await tx.coupon.update({ where: { code: dto.couponCode.toUpperCase() }, data: { used: { increment: 1 } } }).catch(() => null);
      return created;
    });
    return order;
  }

  async list(filter?: { status?: OrderStatus; search?: string }) {
    return this.prisma.order.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.search ? { OR: [
          { id: { contains: filter.search, mode: 'insensitive' } },
          { trackingNumber: { contains: filter.search, mode: 'insensitive' } },
          { customerPhone: { contains: filter.search } },
          { customerLast: { contains: filter.search, mode: 'insensitive' } },
        ] } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async byId(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  async byTracking(tracking: string) {
    const order = await this.prisma.order.findUnique({ where: { trackingNumber: tracking }, include: { items: true } });
    if (!order) throw new NotFoundException('Suivi introuvable');
    return order;
  }

  async byBuyer(target: string) {
    return this.prisma.order.findMany({
      where: { OR: [{ customerPhone: target }, { customerEmail: target.toLowerCase() }] },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: OrderStatus, note?: string) {
    const order = await this.byId(id);
    const history = (order.history as any[] | null) ?? [];
    history.push({ status, note: note ?? null, at: new Date().toISOString() });
    return this.prisma.order.update({ where: { id }, data: { status, history: history as Prisma.JsonArray } });
  }
}
