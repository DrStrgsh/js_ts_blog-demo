import { IsString, MinLength, MaxLength } from 'class-validator'

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(20_000)
  content!: string
}
