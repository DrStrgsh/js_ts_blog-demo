import { IsEnum } from 'class-validator'

export enum ReactionTypeEnum {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE',
}

export class ReactionDto {
  @IsEnum(ReactionTypeEnum)
  type!: ReactionTypeEnum
}
