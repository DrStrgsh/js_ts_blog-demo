import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: {
    userId?: string
    limit?: number
    cursor?: string
  }) {
    const limit = Math.min(params?.limit ?? 10, 50)
    const cursor = params?.cursor
    const userId = params?.userId
    const posts = await this.prisma.post.findMany({
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    const hasNextPage = posts.length > limit
    const pageItems = hasNextPage ? posts.slice(0, limit) : posts
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1].id : null
    const postIds = pageItems.map((p) => p.id)

    const grouped = await this.prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: {
        postId: { in: postIds },
      },
      _count: { _all: true },
    })
    const countsMap = new Map<string, { LIKE: number; DISLIKE: number }>()

    for (const row of grouped) {
      const prev = countsMap.get(row.postId) ?? { LIKE: 0, DISLIKE: 0 }
      const count = row._count._all

      if (row.type === 'LIKE') prev.LIKE = count
      if (row.type === 'DISLIKE') prev.DISLIKE = count

      countsMap.set(row.postId, prev)
    }

    let myReactionMap: Map<string, 'LIKE' | 'DISLIKE'> | null = null

    if (userId) {
      const myReactions = await this.prisma.postReaction.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: {
          postId: true,
          type: true,
        },
      })

      myReactionMap = new Map()
      for (const r of myReactions) {
        myReactionMap.set(r.postId, r.type)
      }
    }

    return {
      items: pageItems.map((p) => {
        const counts = countsMap.get(p.id) ?? { LIKE: 0, DISLIKE: 0 }

        return {
          id: p.id,
          title: p.title,
          content: p.content,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          likeCount: counts.LIKE,
          dislikeCount: counts.DISLIKE,
          commentCount: p._count.comments,
          myReaction: myReactionMap ? myReactionMap.get(p.id) ?? null : undefined,
        }
      }),
      nextCursor,
    }
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
