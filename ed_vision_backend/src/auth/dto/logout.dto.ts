import { IsEmail } from 'class-validator';

export class LogoutDto {
  @IsEmail()
  email: string;
}
