import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export type CurrentUserPayload = {
  userId: string
  role: string
  email: string
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest()

    return request.user as CurrentUserPayload | undefined
  },
)
