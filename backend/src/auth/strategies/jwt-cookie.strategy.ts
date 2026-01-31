import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'

@Injectable()
export class JwtCookieStrategy
  extends PassportStrategy(Strategy, 'jwt-cookie')
{
  constructor(private readonly config: ConfigService) {
    const cookieName = config.get<string>('AUTH_COOKIE_NAME') ?? 'access_token'
    const secret = config.get<string>('JWT_ACCESS_SECRET')

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set')
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[cookieName],
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: { sub: number; role: string; email: string }) {
    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    }
  }
}
