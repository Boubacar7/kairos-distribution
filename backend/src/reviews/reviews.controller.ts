import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ReviewStatus, Role } from '@prisma/client';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post()
  create(@Body() dto: CreateReviewDto) { return this.reviews.create(dto); }

  @Get()
  list(@Query('productId') productId?: string) { return this.reviews.listApproved(productId); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @Get('admin')
  listAll(@Query('status') status?: ReviewStatus) { return this.reviews.listAll(status); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) { return this.reviews.moderate(id, dto.status); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.reviews.remove(id); }
}
