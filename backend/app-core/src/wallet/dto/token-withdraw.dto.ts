import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsLowercase,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Matches
} from 'class-validator';

export class TokenWithdrawDto {
    @IsString()
    @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid token address format' })
    tokenAddress: string;

    @IsNumber()
    @IsPositive({ message: 'Amount must be greater than 0' })
    amount: number;

    @IsString()
    @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid wallet address format' })
    to: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @IsLowercase()
    email: string;
}
