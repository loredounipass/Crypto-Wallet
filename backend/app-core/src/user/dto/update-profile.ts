import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(50)
  firstName?: string;  

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;   

  @IsEmail()
  @IsOptional()
  email?: string;     
}
