import { INestApplication } from '@nestjs/common'
import {
  bootstrapE2E,
  http,
  createAndLoginUser,
  loginAdmin,
  createPostAsAdmin,
} from './helpers/e2e-helpers'

describe('Comments e2e', () => {
  let app: INestApplication
  let client: ReturnType<typeof http>

  beforeAll(async () => {
    app = await bootstrapE2E()
    client = http(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /posts/:postId/comments -> 400 (invalid UUID v4)', async () => {
    await client.get('/posts/wrong/comments').expect(400)
  })

  it('POST /posts/:postId/comments -> 401 (no cookie)', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    await client
      .post(`/posts/${postId}/comments`)
      .send({ body: 'Fail' })
      .expect(401)
  })

  it('POST /posts/:postId/comments -> 400 (invalid body)', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    const { cookies: userCookies } = await createAndLoginUser(client)

    await client
      .post(`/posts/${postId}/comments`)
      .set('Cookie', userCookies)
      .send({ body: '' })
      .expect(400)
  })

  it('POST /posts/:postId/comments -> 201', async () => {
    const { cookies: adminCookies } = await loginAdmin(client)
    const { id: postId } = await createPostAsAdmin(client, adminCookies, {
      title: `Post ${Date.now()}`,
      content: 'Test',
    })

    const { cookies: userCookies } = await createAndLoginUser(client)

    const createRes = await client
      .post(`/posts/${postId}/comments`)
      .set('Cookie', userCookies)
      .send({ body: 'Comment' })
      .expect(201)

    expect(createRes.body.id).toBeTruthy()
    expect(createRes.body.body).toBe('Comment')
    expect(createRes.body.author?.email).toBeTruthy()

    const listRes = await client.get(`/posts/${postId}/comments`).expect(200)

    expect(Array.isArray(listRes.body)).toBe(true)

    const found = listRes.body.find((c: any) => c.id === createRes.body.id)

    expect(found).toBeTruthy()
    expect(found.body).toBe('Comment')
    expect(found.author?.email).toBeTruthy()
  })

  it('POST /posts/:postId/comments -> 404', async () => {
    const { cookies: userCookies } = await createAndLoginUser(client)
    const wrongId = '11111111-1111-4111-8111-111111111111'

    await client
      .post(`/posts/${wrongId}/comments`)
      .set('Cookie', userCookies)
      .send({ body: 'Fali' })
      .expect(404)
  })
})
