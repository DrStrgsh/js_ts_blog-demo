import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ReactionsController } from './reactions.controller'
import { ReactionsService } from './reactions.service'

@Module({
  imports: [PrismaService],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: []
})

export class ReactionsModule {}
