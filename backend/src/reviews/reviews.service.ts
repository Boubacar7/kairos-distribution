import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateReviewDto) {
    return this.prisma.review.create({ data: { ...dto, status: ReviewStatus.PENDING } });
  }

  listApproved(productId?: string) {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.APPROVED, ...(productId ? { productId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listAll(status?: ReviewStatus) {
    return this.prisma.review.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async moderate(id: string, status: ReviewStatus) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Avis introuvable');
    return this.prisma.review.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.prisma.review.delete({ where: { id } }).catch(() => null);
    return { ok: true };
  }
}
