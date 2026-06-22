import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'ელ-ფოსტის ფორმატი არასწორია' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'შეავსეთ ყველა ველი' })
  password: string;
}
