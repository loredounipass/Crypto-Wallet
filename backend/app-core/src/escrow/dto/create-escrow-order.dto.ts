import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsNumber,
    IsPositive,
    IsString,
    IsOptional,
    IsBoolean
} from 'class-validator';

export class CreateEscrowOrderDto {
    @IsString()
    @Transform(({ value }) => value.toUpperCase())
    coin: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsNumber()
    @IsPositive()
    fiatAmount: number;

    @IsString()
    @IsEmail()
    providerEmail: string;

    @IsString()
    paymentMethod: string;

    @IsOptional()
    @IsString()
    tokenAddress?: string;

    @IsOptional()
    @IsBoolean()
    isToken?: boolean;

    @IsOptional()
    @IsNumber()
    chainId?: number;
}
