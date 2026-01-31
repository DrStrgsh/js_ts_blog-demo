import { INestApplication } from '@nestjs/common'
import {
  bootstrapE2E,
  http,
  FIXTURES,
  uniqueEmail,
  extractCookies,
  registerUser,
  login,
} from './helpers/e2e-helpers'
import request from 'supertest'

describe('Auth e2e', () => {
  let app: INestApplication
  let client: ReturnType<typeof http>

  beforeAll(async () => {
    app = await bootstrapE2E()
    client = http(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /auth/register -> 201', async () => {
    const email = uniqueEmail('reg')
    const password = FIXTURES.user.password

    const res = await registerUser(client, { email, password }).expect(201)
    expect(res.body.email).toBe(email)
    expect(res.body.id).toBeTruthy()
  })

  it('POST /auth/register -> 400 (invalid email)', async () => {
    await registerUser(client, { email: 'wrong-email', password: 'password' }).expect(400)
  })

  it('POST /auth/register -> 400 (short password)', async () => {
    await registerUser(client, { email: uniqueEmail('short'), password: 'pas' }).expect(400)
  })

  it('POST /auth/login -> 200 + set-cookie', async () => {
    const email = uniqueEmail('login')
    const password = FIXTURES.user.password

    await registerUser(client, { email, password }).expect(201)

    const res = await client.post('/auth/login').send({ email, password }).expect(200)
    const cookies = extractCookies(res.headers['set-cookie'])

    expect(cookies.length).toBeGreaterThan(0)
  })

  it('POST /auth/login -> 401 (wrong password)', async () => {
    const email = uniqueEmail('wrongpass')
    const password = FIXTURES.user.password

    await registerUser(client, { email, password }).expect(201)

    await client
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401)
  })

  it('GET /auth/me -> 401 (no cookie)', async () => {
    await client.get('/auth/me').expect(401)
  })

  it('GET /auth/me -> 200 (with cookie)', async () => {
    const email = uniqueEmail('me')
    const password = FIXTURES.user.password

    await registerUser(client, { email, password }).expect(201)
    const { cookies } = await login(client, { email, password })
    const res = await client
      .get('/auth/me')
      .set('Cookie', cookies)
      .expect(200)

    expect(res.body.email).toBe(email)
    expect(res.body.userId).toBeTruthy()
  })

  it('POST /auth/logout -> 204 + clears cookie', async () => {
    const agent = request.agent(app.getHttpServer())
    const email = uniqueEmail('logout')
    const password = FIXTURES.user.password

    await agent.post('/auth/register').send({ email, password }).expect(201)
    await agent.post('/auth/login').send({ email, password }).expect(200)
    await agent.get('/auth/me').expect(200)
    await agent.post('/auth/logout').expect(204)
    await agent.get('/auth/me').expect(401)
  })
})
