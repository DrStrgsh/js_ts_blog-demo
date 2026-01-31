import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { AppModule } from '../src/app.module'

function extractCookies(setCookie: string | string[] | undefined): string[] {
  if (!setCookie) return []

  return Array.isArray(setCookie) ? setCookie : [setCookie]
}

describe('blog-demo e2e', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )

    app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
    })

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('auth cookies + admin post + user comment + reactions + myReaction', async () => {
    const email = `user_${Date.now()}@main.com`
    const password = 'password'

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201)

    expect(registerRes.body.email).toBe(email)

    const loginUserRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200)

    const userSetCookie = extractCookies(loginUserRes.headers['set-cookie'])
    expect(userSetCookie.length).toBeGreaterThan(0)

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', userSetCookie!)
      .expect(200)

    expect(meRes.body.email).toBe(email)
    expect(meRes.body.userId).toBeTruthy()

    await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', userSetCookie!)
      .send({ title: 'Title', content: 'Should fail' })
      .expect(403)

    const adminEmail = 'admin@mail.com'
    const adminPassword = 'password'

    const loginAdminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200)

    const adminSetCookie = extractCookies(loginAdminRes.headers['set-cookie'])
    expect(adminSetCookie.length).toBeGreaterThan(0)

    const createPostRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', adminSetCookie!)
      .send({ title: 'E2E Post', content: 'By admin' })
      .expect(201)

    const postId: string = createPostRes.body.id
    expect(postId).toBeTruthy()

    const createCommentRes = await request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Cookie', userSetCookie!)
      .send({ body: 'Somebody once told me...' })
      .expect(201)

    expect(createCommentRes.body.body).toBe('Somebody once told me...')
    expect(createCommentRes.body.author?.email).toBe(email)

    const likeRes = await request(app.getHttpServer())
      .post(`/posts/${postId}/reactions`)
      .set('Cookie', userSetCookie!)
      .send({ type: 'LIKE' })
      .expect(201)

    expect(likeRes.body.type).toBe('LIKE')

    const listMeRes = await request(app.getHttpServer())
      .get('/posts/me?limit=20')
      .set('Cookie', userSetCookie!)
      .expect(200)

    expect(Array.isArray(listMeRes.body.items)).toBe(true)

    const found = listMeRes.body.items.find((p: any) => p.id === postId)
    expect(found).toBeTruthy()
    expect(found.myReaction).toBe('LIKE')
    expect(typeof found.likeCount).toBe('number')
    expect(typeof found.dislikeCount).toBe('number')
    expect(typeof found.commentCount).toBe('number')

    const listPublicRes = await request(app.getHttpServer())
      .get('/posts?limit=2')
      .expect(200)

    expect(Array.isArray(listPublicRes.body.items)).toBe(true)
    expect('nextCursor' in listPublicRes.body).toBe(true)

    const publicFound = listPublicRes.body.items.find((p: any) => p.id === postId)
    if (publicFound) {
      expect(publicFound.myReaction).toBeUndefined()
    }
  })
})
