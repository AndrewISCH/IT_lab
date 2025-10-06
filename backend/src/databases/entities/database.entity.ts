import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';

@Entity('databases')
export class Database {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text')
  createdBy: string;

  @CreateDateColumn({ type: 'text' })
  createdAt: string;

  @UpdateDateColumn({ type: 'text' })
  updatedAt: string;

  @ManyToOne(() => User, (user) => user.databases)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => Permission, (permission) => permission.database)
  permissions: Permission[];
}
