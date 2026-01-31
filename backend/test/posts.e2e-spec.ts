import { INestApplication } from '@nestjs/common'
import {
  bootstrapE2E,
  http,
  createAndLoginUser,
  loginAdmin,
  createPostAsAdmin,
} from './helpers/e2e-helpers'

describe('Posts e2e', () => {
  let app: INestApplication
  let client: ReturnType<typeof http>

  beforeAll(async () => {
    app = await bootstrapE2E()
    client = http(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /posts returns { items, nextCursor }', async () => {
    const res = await client.get('/posts?limit=2').expect(200)

    expect(Array.isArray(res.body.items)).toBe(true)
    expect('nextCursor' in res.body).toBe(true)
    expect(res.body.items.length).toBeLessThanOrEqual(2)

    if (res.body.items[0]) {
      expect(res.body.items[0].id).toBeTruthy()
      expect(typeof res.body.items[0].likeCount).toBe('number')
      expect(typeof res.body.items[0].dislikeCount).toBe('number')
      expect(typeof res.body.items[0].commentCount).toBe('number')
    }
  })

  it('GET /posts pagination cursor works', async () => {
    const first = await client.get('/posts?limit=2').expect(200)
    const nextCursor: string | null = first.body.nextCursor ?? null

    if (!nextCursor) {
      return
    }

    const second = await client
      .get(`/posts?limit=2&cursor=${encodeURIComponent(nextCursor)}`)
      .expect(200)

    expect(Array.isArray(second.body.items)).toBe(true)
    expect(second.body.items.length).toBeLessThanOrEqual(2)

    const firstIds = new Set(first.body.items.map((p: any) => p.id))
    for (const p of second.body.items) {
      expect(firstIds.has(p.id)).toBe(false)
    }
  })

  it('POST /posts is ADMIN-only -> USER gets 403', async () => {
    const { cookies: userCookies } = await createAndLoginUser(client)

    await client
      .post('/posts')
      .set('Cookie', userCookies)
      .send({ title: 'Some title', content: 'Fail' })
      .expect(403)
  })

  it('POST /posts -> ADMIN can create, then GET /posts/me with myReaction when reacted', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Title ${Date.now()}`,
      content: 'By admin',
    })
    const { cookies: userCookies } = await createAndLoginUser(client)

    await client
      .post(`/posts/${postId}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(201)

    const me = await client.get('/posts/me?limit=20').set('Cookie', userCookies).expect(200)
    const found = me.body.items.find((p: any) => p.id === postId)

    expect(found).toBeTruthy()
    expect(found.myReaction).toBe('LIKE')
  })

  it('GET /posts/:id with invalid UUID -> 400', async () => {
    await client.get('/posts/wrong').expect(400)
  })
})
