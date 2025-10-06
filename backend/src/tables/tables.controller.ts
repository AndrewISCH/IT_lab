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
import { TablesService } from './tables.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateTableDto } from './dto/create-table.dto';
import { RenameColumnDto } from './dto/rename-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';

@Controller('databases/:dbId/tables')
@UseGuards(AuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Body() createDto: CreateTableDto,
  ) {
    const schema = await this.tablesService.create(
      dbId,
      user.userId,
      createDto.name,
      createDto.columns,
    );

    return {
      name: schema.name,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
      columnCount: schema.columns.length,
      columns: schema.columns,
    };
  }

  @Get()
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
  ) {
    return await this.tablesService.listTables(dbId, user.userId);
  }

  @Get(':tableName')
  async getSchema(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
  ) {
    const schema = await this.tablesService.getSchema(
      dbId,
      user.userId,
      tableName,
    );

    return {
      name: schema.name,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
      isDropped: schema.isDropped,
      columnCount: schema.columns.length,
      columns: schema.columns,
    };
  }

  @Delete(':tableName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async drop(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
  ) {
    await this.tablesService.drop(dbId, user.userId, tableName);
  }

  @Patch(':tableName/rename-column')
  async renameColumn(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Body() renameDto: RenameColumnDto,
  ) {
    const schema = await this.tablesService.renameColumn(
      dbId,
      user.userId,
      tableName,
      renameDto.oldName,
      renameDto.newName,
    );

    return {
      name: schema.name,
      updatedAt: schema.updatedAt,
      columnCount: schema.columns.length,
      columns: schema.columns,
    };
  }

  @Patch(':tableName/reorder-columns')
  async reorderColumns(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Body() reorderDto: ReorderColumnsDto,
  ) {
    const schema = await this.tablesService.reorderColumns(
      dbId,
      user.userId,
      tableName,
      reorderDto.columnOrder,
    );

    return {
      name: schema.name,
      updatedAt: schema.updatedAt,
      columnCount: schema.columns.length,
      columns: schema.columns,
    };
  }

  @Patch(':tableName/schema')
  async updateSchema(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Body() updateDto: UpdateSchemaDto,
  ) {
    const schema = await this.tablesService.updateSchema(
      dbId,
      user.userId,
      tableName,
      updateDto.columns,
    );

    return {
      name: schema.name,
      updatedAt: schema.updatedAt,
      columnCount: schema.columns.length,
      columns: schema.columns,
    };
  }
}
