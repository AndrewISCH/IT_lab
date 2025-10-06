import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Database } from '../../databases/entities/database.entity';
import { Permission } from '../../databases/entities/permission.entity';

@Entity('users')
export class User {
  @PrimaryColumn('text')
  id: string;

  @Column('text', { unique: true })
  username: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  passwordHash: string;

  @CreateDateColumn({ type: 'text' })
  createdAt: string;

  @UpdateDateColumn({ type: 'text' })
  updatedAt: string;

  @OneToMany(() => Database, (database) => database.creator)
  databases: Database[];

  @OneToMany(() => Permission, (permission) => permission.user)
  permissions: Permission[];
}
