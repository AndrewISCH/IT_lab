import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { DatabasesModule } from '../databases/databases.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [DatabasesModule, StorageModule, AuthModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
