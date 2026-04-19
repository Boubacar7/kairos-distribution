import { IsArray, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @IsString() productId: string;
  @IsOptional() @IsString() variantId?: string;
  @IsInt() @Min(1) qty: number;
}

export class CustomerDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() city: string;
  @IsOptional() @IsString() country?: string;
}

export class CreateOrderDto {
  @ValidateNested() @Type(() => CustomerDto)
  customer: CustomerDto;

  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() zoneId?: string;
  @IsOptional() @IsString() notes?: string;
}
