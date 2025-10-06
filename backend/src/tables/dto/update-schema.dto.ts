import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ColumnUpdateDto {
  @IsString()
  oldName: string;

  @IsOptional()
  @IsString()
  newName?: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class UpdateSchemaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ColumnUpdateDto)
  columns: ColumnUpdateDto[];
}
