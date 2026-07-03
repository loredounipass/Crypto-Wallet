import { IsString, IsIn } from 'class-validator';

export class UpdateLanguageDto {
    @IsString()
    @IsIn(['en', 'es'])
    language: string;
}
