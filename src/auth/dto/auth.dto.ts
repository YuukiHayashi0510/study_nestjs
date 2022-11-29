import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// classValidator で client からのデータにバリデーション可能
export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;
}
