import { IsObject, IsNotEmpty } from 'class-validator';

export class UpdateRecordDto {
  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;
}
