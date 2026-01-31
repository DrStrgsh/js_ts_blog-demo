import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = 'admin@mail.com'
  const adminPassword = 'password'

  const userEmail = 'user@mail.com'
  const userPassword = 'password'

  const adminHash = await argon2.hash(adminPassword)
  const userHash = await argon2.hash(userPassword)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      passwordHash: adminHash,
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    select: { id: true, email: true, role: true },
  })

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      role: 'USER',
      passwordHash: userHash,
    },
    create: {
      email: userEmail,
      passwordHash: userHash,
      role: 'USER',
    },
    select: { id: true, email: true, role: true },
  })

  const existingPosts = await prisma.post.count()
  if (existingPosts === 0) {
    await prisma.post.createMany({
      data: [
        {
          title: 'Post one',
          content: 'Content for post one',
        },
        {
          title: 'Post two',
          content: 'Content for post two',
        },
        {
          title: 'Post three',
          content: 'Content for post three',
        },
      ],
    })
  }

  const firstPost = await prisma.post.findFirst({ orderBy: { createdAt: 'asc' } })
  if (firstPost) {
    const existingComment = await prisma.comment.findFirst({
      where: { postId: firstPost.id, authorId: user.id },
    })

    if (!existingComment) {
      await prisma.comment.create({
        data: {
          postId: firstPost.id,
          authorId: user.id,
          body: 'Comment from user user@mail.com',
        },
      })
    }

    await prisma.postReaction.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId: firstPost.id,
        },
      },
      create: {
        userId: user.id,
        postId: firstPost.id,
        type: 'LIKE',
      },
      update: {
        type: 'LIKE',
      },
    })
  }

  // eslint-disable-next-line no-console
  console.log('Seed completed')
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
