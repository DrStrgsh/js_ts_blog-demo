import { request } from './client'

export type ReactionType = 'LIKE' | 'DISLIKE'

export type ReactionBody = {
  type: ReactionType
}

export type Reaction = {
  id: string
  type: ReactionType
  postId: string
  userId: string
  [key: string]: unknown
}

export type OkResponse = { ok: true }

export const reactionsApi = {
  setForPost(postId: string, body: ReactionBody): Promise<Reaction> {
    return request<Reaction, ReactionBody>({
      method: 'POST',
      path: `/posts/${encodeURIComponent(postId)}/reactions`,
      body,
    })
  },

  removeForPost(postId: string): Promise<OkResponse> {
    return request<OkResponse>({
      method: 'DELETE',
      path: `/posts/${encodeURIComponent(postId)}/reactions`m
    })
  },
}
