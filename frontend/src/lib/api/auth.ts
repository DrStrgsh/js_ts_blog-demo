import { request } from './client'

export type Role = 'USER' | 'ADMIN'

export type MeResponse = {
  userId: string
  email: string
  role: Role
}

export type RegisterBody = {
  email: string
  password: string
}

export type LoginBody = {
  email: string
  password: string
}

export type AuthUser = {
  id: string
  email: string
  role: Role
  [key: string]: unknown
}

export const authApi = {
  register(body: RegisterBody): Promise<AuthUser> {
    return request<AuthUser, RegisterBody>({
      method: 'POST',
      path: '/auth/register',
      body,
    })
  },

  login(body: LoginBody): Promise<AuthUser> {
    return request<AuthUser, LoginBody>({
      method: 'POST',
      path: '/auth/login',
      body,
    })
  },

  logout(): Promise<void> {
    return request<void>({
      method: 'POST',
      path: '/auth/logout',
    })
  },

  me(): Promise<MeResponse> {
    return request<MeResponse>({
      method: 'GET',
      path: '/auth/me',
    })
  },
}
