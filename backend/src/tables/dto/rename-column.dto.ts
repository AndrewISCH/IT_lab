import { IsString, MinLength } from 'class-validator';

export class RenameColumnDto {
  @IsString()
  @MinLength(1)
  oldName: string;

  @IsString()
  @MinLength(1)
  newName: string;
}
