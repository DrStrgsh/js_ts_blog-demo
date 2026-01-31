import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { JwtCookieStrategy } from './strategies/jwt-cookie.strategy'

@Module({
  imports: [ // що потрібно з інших модулів
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET')
        const expiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m'

        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is not set')
        }

        return {
          secret,
          expiresIn,
        }
      }
    }),
  ],
  controllers: [AuthController], // які контролери належать цьому модулю
  providers: [ // логіка модуля
    AuthService,
    JwtCookieStrategy,
  ],
  exports: [], // що цей модуль віддає іншим модулям
})

export class AuthModule {}
