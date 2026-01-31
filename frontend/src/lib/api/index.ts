import { authApi } from './auth'
import { commentsApi } from './comments'
import { postsApi } from './posts'
import { reactionsApi } from './reactions'

export { ApiError } from './client'
export { authApi } from './auth'
export { postsApi } from './posts'
export { commentsApi } from './comments'
export { reactionsApi } from './reactions'

export const api = {
  auth: authApi,
  posts: postsApi,
  comments: commentsApi,
  reactions: reactionsApi,
}

export type { Role, MeResponse, RegisterBody, LoginBody, AuthUser } from './auth'
export type {
  MyReactionType,
  PostListItem,
  AuthedPostListItem,
  CursorPage,
  Post,
  CreatePostBody,
  UpdatePostBody,
  OkResponse,
  ListParams,
} from './posts'
export type { Comment, CommentAuthor, CreateCommentBody } from './comments'
export type {
  ReactionType,
  ReactionBody,
  Reaction,
  OkResponse as ReactionOkResponse,
} from './reactions'
