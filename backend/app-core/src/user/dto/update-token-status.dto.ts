import { IsBoolean } from 'class-validator';

export class UpdateTokenStatusDto {
    @IsBoolean()
    isTokenEnabled: boolean;
}
