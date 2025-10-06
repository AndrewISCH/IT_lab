import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Database } from './database.entity';
import { DatabaseRole } from '../../common/types/database-role.enum';

@Entity('permissions')
export class Permission {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text')
  databaseId: string;

  @Column('text')
  role: DatabaseRole;

  @CreateDateColumn({ type: 'text' })
  grantedAt: string;

  @Column('text')
  grantedBy: string;

  @ManyToOne(() => User, (user) => user.permissions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Database, (database) => database.permissions)
  @JoinColumn({ name: 'databaseId' })
  database: Database;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'grantedBy' })
  grantor: User;
}
