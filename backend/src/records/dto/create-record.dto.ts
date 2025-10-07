import { IsArray, IsNotEmpty } from 'class-validator';

export class CreateRecordDto {
  @IsArray()
  @IsNotEmpty()
  data: Record<string, unknown>[];
}
