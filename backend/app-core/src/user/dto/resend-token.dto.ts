import { IsEmail, IsString, IsOptional } from 'class-validator';

export class ResendTokenDto {
  @IsEmail()
  @IsOptional()
  email?: string;
}
