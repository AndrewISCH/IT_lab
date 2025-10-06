import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, TypeOrmModule],
})
export class AuthModule {}
