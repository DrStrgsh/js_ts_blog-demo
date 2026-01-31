import { request, withQuery } from './client'

export type MyReactionType = 'LIKE' | 'DISLIKE'

export type PostListItem = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  likeCound: number
  dislikeCount: number
  commentCount: number
}

export type AuthedPostListItem = PostListItem & {
  myReaction: MyReactionType | null
}

export type CursorPage<TItem> = {
  items: TItem[]
  nextCursor: string | null
}

export type Post = PostListItem

export type CreatePostBody = {
  title: string
  content: string
}

export type UpdatePostBody = Partial<CreatePostBody>

export type OkResponse = { ok: true }

export type ListParams = {
  limit?: number
  cursor?: string | null
}

export const postsApi = {
  list(params?: ListParams): Promise<CursorPage<PostListItem>> {
    return request<CursorPage<PostListItem>>({
      method: 'GET',
      path: withQuery('/posts', {
        limit: params?.limit,
        cursor: params?.cursor ?? undefined,
      }),
    })
  },

  listMe(params?: ListParams): Promise<CursorPage<AuthedPostListItem>> {
    return request<CursorPage<AuthedPostListItem>>({
      method: 'GET',
      path: withQuery('/posts/me', {
        limit: params?.limit,
        cursor: params?.cursor ?? undefined,
      }),
    })
  },

  getOne(id: string): Promise<Post> {
    return request<Post>({
      method: 'GET',
      path: `/posts/${encodeURIComponent(id)}`,
    })
  },

  create(body: CreatePostBody): Promise<Post> {
    return request<Post, CreatePostBody>({
      method: 'POST',
      path: '/posts',
      body,
    })
  },

  update(id: string, body: UpdatePostBody): Promise<Post> {
    return request<Post, UpdatePostBody>({
      method: 'PATCH',
      path: `/posts/${encodeURIComponent(id)}`,
      body,
    })
  },

  remove(id: string): Promise<OkResponse> {
    return request<OkResponse>({
      method: 'DELETE',
      path: `/posts/${encodeURIComponent(id)}`
    })
  },
}
