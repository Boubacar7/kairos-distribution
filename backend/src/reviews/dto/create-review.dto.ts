import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() contact: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsString() @IsNotEmpty() text: string;
  @IsOptional() @IsString() photo?: string;
}
