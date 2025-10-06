import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';
import { GrantPermissionDto } from './dto/grant-permission.dto';
import {
  canDeleteDatabase,
  canEditData,
  canModifySchema,
  canManagePermissions,
  canViewData,
  canChangeOwner,
} from 'src/common/types/database-role.enum';

@Controller('databases')
@UseGuards(AuthGuard)
export class DatabasesController {
  constructor(private readonly databasesService: DatabasesService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createDto: CreateDatabaseDto,
  ) {
    const database = await this.databasesService.create(
      user.userId,
      createDto.name,
      createDto.description,
    );

    return {
      id: database.id,
      name: database.name,
      description: database.description,
      createdBy: database.createdBy,
      createdAt: database.createdAt,
      updatedAt: database.updatedAt,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    const databases = await this.databasesService.findAllForUser(user.userId);

    return databases.map((db) => ({
      id: db.id,
      name: db.name,
      description: db.description,
      createdBy: db.createdBy,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    }));
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    const { database, role } = await this.databasesService.findByIdWithAccess(
      id,
      user.userId,
    );

    return {
      id: database.id,
      name: database.name,
      description: database.description,
      createdBy: database.createdBy,
      createdAt: database.createdAt,
      updatedAt: database.updatedAt,
      userRole: role,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() updateDto: UpdateDatabaseDto,
  ) {
    const database = await this.databasesService.update(
      id,
      user.userId,
      updateDto,
    );

    return {
      id: database.id,
      name: database.name,
      description: database.description,
      updatedAt: database.updatedAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.databasesService.remove(id, user.userId);
  }

  @Post(':id/permissions')
  async grantPermission(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() grantDto: GrantPermissionDto,
  ) {
    const permission = await this.databasesService.grantPermission(
      id,
      user.userId,
      grantDto.userId,
      grantDto.role,
    );

    return {
      id: permission.id,
      userId: permission.userId,
      databaseId: permission.databaseId,
      role: permission.role,
      grantedAt: permission.grantedAt,
      grantedBy: permission.grantedBy,
    };
  }

  @Delete(':id/permissions/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePermission(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.databasesService.revokePermission(id, user.userId, targetUserId);
  }

  @Get(':id/permissions')
  async getPermissions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    const permissions = await this.databasesService.getPermissions(
      id,
      user.userId,
    );

    return permissions.map((p) => ({
      id: p.id,
      userId: p.userId,
      username: p.user?.username,
      role: p.role,
      canEditData: canEditData(p.role),
      canModifySchema: canModifySchema(p.role),
      canDeleteDatabase: canDeleteDatabase(p.role),
      canViewData: canViewData(p.role),
      canManagePermissions: canManagePermissions(p.role),
      canChangeOwner: canChangeOwner(p.role),
      grantedAt: p.grantedAt,
      grantedBy: p.grantedBy,
    }));
  }

  @Get(':id/permissions/me')
  async getMyPermissions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    const permissionData = await this.databasesService.getUserPermissions(
      id,
      user.userId,
    );
    return (
      permissionData && {
        id: permissionData.id,
        userId: permissionData.userId,
        username: permissionData.user?.username,
        role: permissionData.role,
        canEditData: canEditData(permissionData.role),
        canModifySchema: canModifySchema(permissionData.role),
        canDeleteDatabase: canDeleteDatabase(permissionData.role),
        canViewData: canViewData(permissionData.role),
        canManagePermissions: canManagePermissions(permissionData.role),
        canChangeOwner: canChangeOwner(permissionData.role),
        grantedAt: permissionData.grantedAt,
        grantedBy: permissionData.grantedBy,
      }
    );
  }
}
