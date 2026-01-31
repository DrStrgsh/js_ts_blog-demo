import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator'

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20_000)
  content?: string
}
