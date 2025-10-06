import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabasesModule } from './databases/databases.module';
import { TablesModule } from './tables/tables.module';
import { RecordsModule } from './records/records.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    StorageModule,
    UsersModule,
    DatabasesModule,
    TablesModule,
    RecordsModule,
  ],
})
export class AppModule {}
