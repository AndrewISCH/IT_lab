import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasesController } from './databases.controller';
import { DatabasesService } from './databases.service';
import { Database } from './entities/database.entity';
import { Permission } from './entities/permission.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Database, Permission]),
    UsersModule,
    AuthModule,
  ],
  controllers: [DatabasesController],
  providers: [DatabasesService],
  exports: [DatabasesService, TypeOrmModule],
})
export class DatabasesModule {}
