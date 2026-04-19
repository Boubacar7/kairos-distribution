import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { OrderStatus, Role } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) { return this.orders.create(dto); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @Get()
  list(@Query('status') status?: OrderStatus, @Query('search') search?: string) { return this.orders.list({ status, search }); }

  @Get('track/:tracking')
  byTracking(@Param('tracking') tracking: string) { return this.orders.byTracking(tracking); }

  @Get('buyer/:target')
  byBuyer(@Param('target') target: string) { return this.orders.byBuyer(target); }

  @Get(':id')
  byId(@Param('id') id: string) { return this.orders.byId(id); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER, Role.MANAGER, Role.STAFF)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) { return this.orders.updateStatus(id, dto.status, dto.note); }
}
