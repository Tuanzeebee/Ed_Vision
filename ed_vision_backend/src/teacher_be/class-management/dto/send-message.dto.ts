import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
    @IsNotEmpty()
    @IsString()
    studentId: string;

    @IsNotEmpty()
    @IsString()
    message: string;
}
