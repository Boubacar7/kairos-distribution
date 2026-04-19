import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString() @IsNotEmpty()
  username: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsString() @MinLength(6)
  password: string;

  @IsOptional() @IsEnum(Role)
  role?: Role;
}
