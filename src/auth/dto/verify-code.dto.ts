import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail({}, { message: 'ელ-ფოსტის ფორმატი არასწორია' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'კოდი უნდა იყოს 6 ციფრი' })
  code: string;
}
