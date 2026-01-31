import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common'
import { PostsService } from './posts.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PostsQueryDto } from './dto/posts-query.dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator'

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async list(@Query() query: PostsQueryDto) {
    return this.postsService.list({
      limit: query.limit,
      cursor: query.cursor,
    })
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async listForMet(
    @Query() query: PostsQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.postsService.list({
      userId: user.userId,
      limit: query.limit,
      cursor: query.cursor,
    })
  }

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.postsService.getById(id)
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body() body: CreatePostDto,
  ) {
    return this.postsService.create(body)
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.update(id, body)
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.postsService.remove(id)
  }
}
