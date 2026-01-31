import { request } from './client'

export type CommentAuthor = {
  id: string
  email: string
}

export type Comment = {
  id: string
  body: string
  createdAt: string
  upadtedAt: string
  author: CommentAuthor
}

export type CreateCommentBody = {
  body: string
}

export const commentsApi = {
  listForPost(postId: string): Promise<Comment[]> {
    return request<Comment[]>({
      method: 'GET',
      path: `/posts/${encodeURIComponent(postId)}/comments`,
    })
  },

  createForPost(postId: string, body: CreateCommentBody): Promise<Comment> {
    return request<Comment, CreateCommentBody>({
      method: 'POST',
      path: `/posts/${encodeURIComponent(postId)}/comments`,
      body,
    })
  },
}
