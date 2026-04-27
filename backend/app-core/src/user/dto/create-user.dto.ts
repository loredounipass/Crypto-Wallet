import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MaxLength(50)
    firstName: string;

    @IsString()
    @MaxLength(50)
    lastName: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña debe contener mayúsculas, minúsculas y números'
    })
    password: string;

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    confirmPassword: string;
}
