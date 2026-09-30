import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
}

export class CreatePostDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsString()
  multimediaId?: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;
}
