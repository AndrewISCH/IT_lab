import {
  IsString,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateColumnDto } from './create-column.dto';

export class CreateTableDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateColumnDto)
  columns: CreateColumnDto[];
}
