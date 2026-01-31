import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type ReactionType = 'LIKE' | 'DISLIKE'

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async setReaction(params: {
    postId: string
    userId: string
    type: ReactionType
  }) {
    const post = await this.prisma.post.findUnique({
      where: { id: params.postId },
      select: { id: true },
    })

    if (!post) {
      throw new NotFoundException('Pist not found')
    }

    return this.prisma.postReaction.upsert({
      where: {
        userId_postId: {
          userId: params.userId,
          postId: params.postId,
        },
      },
      create: {
        userId: params.userId,
        postId: params.postId,
        type: params.type,
      },
      update: {
        type: params.type,
      },
    })
  }

  async removeReaction(params: { postId: string; userId: string }) {
    const post = await this.prisma.post.findUnique({
      where: { id: params.postId },
      select: { id: true },
    })

    if (!post) {
      throw new NotFoundException('Post not found')
    }

    await this.prisma.postReaction.delete({
      where: {
        userId_postId: {
          userId: params.userId,
          postId: params.postId,
        },
      },
    })

    return { ok: true }
  }
}
