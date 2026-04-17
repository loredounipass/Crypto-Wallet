import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProviderDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @IsOptional()
  @IsString()
  walletAddress?: string;
}
