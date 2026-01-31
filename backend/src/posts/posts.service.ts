import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc'},
    })
  }

  async getById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new NotFoundException('Post not found')
    }

    return post
  }

  async create(data: { title: string; content: string }) {
    return this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
      },
    })
  }

  async update(postId: string, data: { title?: string; content?: string }) {
    await this.getById(postId)

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
      },
    })
  }

  async remove(postId: string) {
    await this.getById(postId)

    await this.prisma.post.delete({
      where: { id: postId },
    })

    return { ok: true }
  }
}
