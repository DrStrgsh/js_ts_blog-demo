import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(params: { email: string; password: string }) {
    const email = params.email.trim().toLowerCase()
    const password = params.password

    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

    const passwordHash = await argon2.hash(password)

    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
      })

      return user
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('Email is already taken')
      }

      throw err
    }
  }

  async validateUser(params: { email: string; password: string }) {
    const email = params.email.trim().toLowerCase()
    const password = params.password
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const ok = await argon2.verify(user.passwordHash, password)
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async login(params: { email: string; password: string }) {
    const user = await this.validateUser(params)
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
    })

    return { user, accessToken }
  }
}
