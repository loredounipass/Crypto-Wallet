import { IsString, IsOptional } from 'class-validator';

export class EscrowActionDto {
    @IsString()
    orderId: string;

    @IsOptional()
    @IsString()
    reason?: string;
}
