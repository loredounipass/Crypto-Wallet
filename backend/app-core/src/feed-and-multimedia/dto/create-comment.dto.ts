import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
