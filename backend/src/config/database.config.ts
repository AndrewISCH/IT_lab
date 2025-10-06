import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from '../users/entities/user.entity';
import { Database } from '../databases/entities/database.entity';
import { Permission } from '../databases/entities/permission.entity';
import { existsSync, mkdirSync } from 'fs';

function ensureDatabasesDirectory() {
  const dbDir = join(process.cwd(), 'databases');
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  ensureDatabasesDirectory();
  console.log(process.cwd());
  return {
    type: 'sqlite',
    database: join(process.cwd(), 'databases', 'internal.db'),
    entities: [User, Database, Permission],
    synchronize: true,
    logging: false,
  };
};

export function getCommunityDbPath(databaseId: string): string {
  ensureDatabasesDirectory();
  const communityDir = join(process.cwd(), 'databases', 'community');

  if (!existsSync(communityDir)) {
    mkdirSync(communityDir, { recursive: true });
  }

  return join(communityDir, `${databaseId}.db`);
}
