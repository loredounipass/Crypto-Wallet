import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The new password must contain uppercase, lowercase and numbers'
    })
    newPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    confirmNewPassword: string;
}
