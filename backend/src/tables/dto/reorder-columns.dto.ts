import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class ReorderColumnsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  columnOrder: string[];
}
