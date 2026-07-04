import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class AddPaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;
}

export class UpdateDestinationWalletDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  coin: string;

  @IsNotEmpty()
  @IsNumber()
  chainId: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
