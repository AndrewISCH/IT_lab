import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  ValidateIf,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataType } from '../../common/types/data-types.enum';

class CharIntervalConfigDto {
  @IsString()
  start: string;

  @IsString()
  end: string;
}

class StringCharIntervalConfigDto {
  @ValidateNested()
  @Type(() => CharIntervalConfigDto)
  charInterval: CharIntervalConfigDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxLength?: number;
}

export class CreateColumnDto {
  @IsString()
  name: string;

  @IsEnum(DataType)
  type: DataType;

  @IsOptional()
  @IsBoolean()
  nullable?: boolean;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @IsBoolean()
  isPrimaryKey?: boolean;

  @IsOptional()
  @IsBoolean()
  autoIncrement?: boolean;

  @IsOptional()
  @ValidateIf(
    (o: CreateColumnDto) =>
      o.type === DataType.CHAR_INTERVAL ||
      o.type === DataType.STRING_CHAR_INTERVAL,
  )
  @ValidateNested()
  @Type((opts) => {
    const obj = opts?.object as CreateColumnDto;
    if (obj.type === DataType.CHAR_INTERVAL) {
      return CharIntervalConfigDto;
    }
    if (obj.type === DataType.STRING_CHAR_INTERVAL) {
      return StringCharIntervalConfigDto;
    }
    return Object;
  })
  typeConfig?: CharIntervalConfigDto | StringCharIntervalConfigDto;
}
