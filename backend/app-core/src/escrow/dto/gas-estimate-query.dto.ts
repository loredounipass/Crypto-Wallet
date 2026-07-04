import { IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class GasEstimateQueryDto {
    @IsString()
    @Transform(({ value }) => value.toUpperCase())
    coin: string;

    @IsNumber()
    @Transform(({ value }) => Number(value))
    chainId: number;
}
