import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsString()
  multimediaId?: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;
}
