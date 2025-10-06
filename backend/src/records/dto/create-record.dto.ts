import { IsObject, IsNotEmpty } from 'class-validator';

export class CreateRecordDto {
  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;
}
