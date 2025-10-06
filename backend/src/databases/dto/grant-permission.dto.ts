import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { DatabaseRole } from '../../common/types/database-role.enum';

export class GrantPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(DatabaseRole)
  role: DatabaseRole;
}
