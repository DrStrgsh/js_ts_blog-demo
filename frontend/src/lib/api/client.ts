export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type RequestOptions<TBody> = {
  method: HttpMethod
  path: string
  body?: TBody
  init?: Omit<RequestInit, 'method' | 'body' | 'credentials'>
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL

  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not set')
  }

  return base.replace(/\/+$/, '')
}

export function withQuery(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!query) return path

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }

  const qs = params.toString()

  return qs ? `${path}?${qs}` : path
}

async function parseResponseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  const text = await res.text()

  return text.length ? text : null
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null

  const maybe = body as any
  const msg = maybe.message

  if (typeof msg === 'string') return msg

  if (Array.isArray(msg)) return msg.join('\n')

  if (typeof maybe.error === 'string') return maybe.error

  return null
}

export async function request<TResponse, TBody = undefined>(
  options: RequestOptions<TBody>,
): Promise<TResponse> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${options.path}`
  const headers: HeadersInit = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.init?.headers ?? {}),
  }

  const res = await fetch(url, {
    method: options.method,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    ...options.init,
  })

  const parsed = await parseResponseBody(res)

  if (!res.ok) {
    const message = extractErrorMessage(parsed) ?? `Request failed: ${options.method} ${options.path} -> ${res.status}`

    throw new ApiError(message, res.status, parsed)
  }

  return parsed as TResponse
}
