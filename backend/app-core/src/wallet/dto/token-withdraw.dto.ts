import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsLowercase,
    IsNumber,
    IsOptional,
    IsString
} from 'class-validator';

export class TokenWithdrawDto {
    @IsString()
    tokenAddress: string;

    @IsNumber()
    amount: number;

    @IsString()
    to: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @IsLowercase()
    email: string;
}
