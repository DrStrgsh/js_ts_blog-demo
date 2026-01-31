import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ReactionsService } from './reactions.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ReactionDto } from './dto/reaction.dto'
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator'

@Controller('posts/:postId/reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async setReaction(
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Body() body: ReactionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reactionsService.setReaction({
      postId,
      userId: user.userId,
      type: body.type,
    })
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async removeReaction(
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reactionsService.removeReaction({
      postId,
      userId: user.userId,
    })
  }
}
