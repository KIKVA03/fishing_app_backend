import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'მომხმარებლის სახელი უნდა იყოს მინიმუმ 3 სიმბოლო' })
  @MaxLength(40)
  username: string;

  @IsEmail({}, { message: 'ელ-ფოსტის ფორმატი არასწორია' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო' })
  @MaxLength(100)
  password: string;
}
