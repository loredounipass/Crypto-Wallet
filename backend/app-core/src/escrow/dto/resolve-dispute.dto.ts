import { IsString, IsIn } from 'class-validator';

export class ResolveDisputeDto {
    @IsString()
    orderId: string;

    @IsString()
    @IsIn(['revert', 'award'])
    type: 'revert' | 'award';
}
