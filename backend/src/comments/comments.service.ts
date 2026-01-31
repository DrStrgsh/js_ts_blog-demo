import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByPost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }})
    if (!post) {
      throw new NotFoundException('Post not found')
    }

    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })
  }

  async create(params: { postId: string; authorId: string; body: string }) {
    const post = await this.prisma.post.findUnique({ where: { id: params.postId } })
    if (!post) {
      throw new NotFoundException('Post not found')
    }

    return this.prisma.comment.create({
      data: {
        postId: params.postId,
        authorId: params.authorId,
        body: params.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })
  }
}
