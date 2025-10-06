import { Module, Global } from '@nestjs/common';
import { CommunityDbService } from './community-db.service';

@Global()
@Module({
  providers: [CommunityDbService],
  exports: [CommunityDbService],
})
export class StorageModule {}
