import { INestApplication } from '@nestjs/common'
import {
  bootstrapE2E,
  http,
  createAndLoginUser,
  loginAdmin,
  createPostAsAdmin,
} from './helpers/e2e-helpers'

describe('Reactions e2e', () => {
  let app: INestApplication
  let client: ReturnType<typeof http>

  beforeAll(async () => {
    app = await bootstrapE2E()
    client = http(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /posts/:postId/reactions -> 401 (no cookie)', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    await client
      .post(`/posts/${postId}/reactions`)
      .send({ type: 'LIKE' })
      .expect(401)
  })

  it('POST /posts/:postId/reaction -> 400 (invalid UUID)', async () => {
    const { cookies: userCookies } = await createAndLoginUser(client)

    await client
      .post(`/posts/wrong/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(400)
  })

  it('POST /posts/:postId/reactions -> 400 (wrong enum)', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    const { cookies: userCookies } = await createAndLoginUser(client)

    await client
      .post(`/posts/${postId}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'FAIL' })
      .expect(400)
  })

  it('POST /posts/:postId/reactions -> 404', async () => {
    const { cookies: userCookies } = await createAndLoginUser(client)
    const wrongId = '11111111-1111-4111-8111-111111111111'

    await client
      .post(`/posts/${wrongId}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(404)
  })

  it('POST sets LIKE, then switches to DISLIKE', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    const { cookies: userCookies } = await createAndLoginUser(client)
    const likeRes = await client
      .post(`/posts/${postId}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(201)

    expect(likeRes.body.type).toBe('LIKE')

    const dislikeRes = await client
      .post(`/posts/${postId}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'DISLIKE' })
      .expect(201)

    expect(dislikeRes.body.type).toBe('DISLIKE')

    const me = await client.get('/posts/me?limit=50').set('Cookie', userCookies).expect(200)
    const found = me.body.items.find((p: any) => p.id === postId)

    expect(found).toBeTruthy()
    expect(found.myReaction).toBe('DISLIKE')
  })

  it('DELETE /posts/:postId/reactions removes reaction', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    const { cookies: userCookies } = await createAndLoginUser(client)

    await client
      .post(`/posts/${postId}/reactions`)
      .set('Cookie', userCookies)
      .send({ type: 'LIKE' })
      .expect(201)

    await client
      .delete(`/posts/${postId}/reactions`)
      .set('Cookie', userCookies)
      .expect(200)

    const me = await client.get('/posts/me?limit=50').set('Cookie', userCookies).expect(200)
    const found = me.body.items.find((p: any) => p.id === postId)

    expect(found).toBeTruthy()
    expect(found.myReaction).toBeNull()
  })
})
