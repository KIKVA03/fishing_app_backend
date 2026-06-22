import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsInt({ message: 'lakeId არასწორია' })
  lakeId: number;

  @IsString()
  @MinLength(1, { message: 'კომენტარი ცარიელია' })
  @MaxLength(500, { message: 'კომენტარი ძალიან გრძელია (მაქს. 500 სიმბოლო)' })
  text: string;
}
