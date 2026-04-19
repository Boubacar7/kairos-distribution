import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'change-me',
      ignoreExpiration: false,
    });
  }
  async validate(payload: { sub: string; username: string; role: string }) {
    const user = await this.auth.validate(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
