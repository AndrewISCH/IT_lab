import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    const fullUser = await this.usersService.findById(user.userId);

    return {
      id: fullUser.id,
      username: fullUser.username,
      email: fullUser.email,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
