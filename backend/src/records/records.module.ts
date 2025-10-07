import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { DatabasesModule } from '../databases/databases.module';
import { TablesModule } from '../tables/tables.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DatabasesModule, TablesModule, UsersModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
