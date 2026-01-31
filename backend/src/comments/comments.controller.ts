import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common'
import { CommentsService } from './comments.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateCommentDto } from './dto/create-comment.dto'
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator'

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async list(@Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string) {
    return this.commentsService.listByPost(postId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Body() body: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.create({
      postId,
      authorId: user.userId,
      body: body.body,
    })
  }
}
