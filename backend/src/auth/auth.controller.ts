import { Body, Controller, Post, Res, HttpCode, Get, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { ConfigService } from '@nestjs/config'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import type { CurrentUserPayload } from './decorators/current-user.decorator'
import type { Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
  ) {
    return this.authService.register(body)
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken } = await this.authService.login(body)
    const cookieName = this.config.get<string>('AUTH_COOKIE_NAME') ?? 'access_token'
    const isSecure = this.config.get<string>('COOKIE_SECURE') === 'true'
    const sameSite = (this.config.get<string>('COOKIE_SAMESITE') as 'lax' | 'strict' | 'none') ?? 'lax'

    res.cookie(cookieName, accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      path: '/',
    })

    return user
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieName = this.config.get<string>('AUTH_COOKIE_NAME') ?? 'access_token'
    const isSecure = this.config.get<string>('COOKIE_SECURE') === 'true'
    const sameSite = (this.config.get<string>('COOKIE_SAMESITE') as 'lax' | 'strict' | 'none') ?? 'lax'

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      path: '/',
    })
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: CurrentUserPayload) {
    return user
  }
}
