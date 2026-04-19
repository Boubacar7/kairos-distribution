import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto.username, dto.password); }

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) { return req.user; }
}
