import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');
    const payload = { sub: user.id, username: user.username, role: user.role };
    return { access_token: await this.jwt.signAsync(payload), user: { id: user.id, username: user.username, role: user.role } };
  }

  async register(data: { username: string; email?: string; password: string; role?: Role }) {
    const exists = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (exists) throw new ConflictException('Nom d\'utilisateur déjà pris');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: { username: data.username, email: data.email, passwordHash, role: data.role ?? Role.STAFF },
      select: { id: true, username: true, role: true, email: true },
    });
    return user;
  }

  async validate(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, role: true } });
  }
}
