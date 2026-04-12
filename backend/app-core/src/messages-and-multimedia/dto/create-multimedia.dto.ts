import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMultimediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  type: string; // image | video | audio

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
