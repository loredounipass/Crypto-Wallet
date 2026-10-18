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

export class WithdrawDto {
    @IsString()
    @Transform((coin) => coin.value.toUpperCase())
    coin: string;

    @IsNumber()
    @IsPositive({ message: 'Amount must be greater than 0' })
    amount: number;

    @IsString()
    @Matches(/^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,90}|T[a-zA-HJ-NP-Z0-9]{33})$/, {
        message: 'Invalid wallet address format'
    })
    to: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @IsLowercase()
    email: string;
}
