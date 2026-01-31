import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { AppModule } from '../../src/app.module'

export type HttpClient = ReturnType<typeof request>

export type CookieJar = string[]

export const FIXTURES = {
  admin: {
    email: 'admin@mail.com',
    password: 'password',
  },
  user: {
    password: 'password',
  },
}

export function extractCookies(setCookie: string | string[] | undefined): CookieJar {
  if (!setCookie) return []

  return Array.isArray(setCookie) ? setCookie : [setCookie]
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}_${Date.now()}@mail.com`
}

export async function bootstrapE2E(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleRef.createNestApplication()

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

  return app
}

export function http(app: INestApplication): HttpClient {
  return request(app.getHttpServer())
}

export function registerUser(
  client: HttpClient,
  params: { email: string; password: string },
) {
  return client.post('/auth/register').send(params)
}

export async function login(
  client: HttpClient,
  params: { email: string; password: string },
): Promise<{ cookies: CookieJar; body: any }> {
  const res = await client.post('/auth/login').send(params).expect(200)
  const cookies = extractCookies(res.headers['set-cookie'])

  return { cookies, body: res.body }
}

export async function loginAdmin(
  client: HttpClient,
): Promise<{ cookies: CookieJar; body: any}> {
  return login(client, FIXTURES.admin)
}

export async function createAndLoginUser(
  client: HttpClient,
  opts?: { emailPrefix?: string; password?: string },
): Promise<{ email: string; password: string; cookies: CookieJar }> {
  const email = uniqueEmail(opts?.emailPrefix ?? 'user')
  const password = opts?.password ?? FIXTURES.user.password

  await registerUser(client, { email, password }).expect(201)
  const { cookies } = await login(client, { email, password })

  return { email, password, cookies }
}

export async function createPostAsAdmin(
  client: HttpClient,
  adminCookies: CookieJar,
  params: { title: string; content: string },
): Promise<{ id: string }> {
  const res = await client
    .post('/posts')
    .set('Cookie', adminCookies)
    .send(params)
    .expect(201)

  return { id: res.body.id }
}

export async function commentAsUser(
  client: HttpClient,
  userCookies: CookieJar,
  postId: string,
  body: string,
) {
  return client
    .post(`/posts/${postId}/comments`)
    .set('Cookie', userCookies)
    .send({ body })
}

export async function reactAsUser(
  client: HttpClient,
  userCookies: CookieJar,
  postId: string,
  type: 'LIKE' | 'DISLIKE',
) {
  return client
    .post(`/posts/${postId}/reactions`)
    .set('Cookie', userCookies)
    .send({ type })
}

export async function removeReactionAsUser(
  client: HttpClient,
  userCookies: CookieJar,
  postId: string,
) {
  return client
    .delete(`/posts/${postId}/reactions`)
    .set('Cookie', userCookies)
}
