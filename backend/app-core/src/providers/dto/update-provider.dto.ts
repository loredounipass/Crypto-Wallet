import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProviderDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @IsOptional()
  @IsString()
  preferredBank?: string;

  @IsOptional()
  @IsArray()
  destinationWallets?: {
    address: string;
    coin: string;
    chainId: number;
    enabled: boolean;
  }[];
}
