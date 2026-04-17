import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsLowercase,
    IsNumber,
    IsOptional,
    IsString
} from 'class-validator';

export class CreateEscrowOrderDto {
    @IsString()
    @Transform(({ value }) => value.toUpperCase())
    coin: string;

    @IsNumber()
    amount: number;

    @IsNumber()
    fiatAmount: number;

    @IsString()
    @IsEmail()
    providerEmail: string;

    @IsString()
    paymentMethod: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @IsLowercase()
    email?: string;
}
