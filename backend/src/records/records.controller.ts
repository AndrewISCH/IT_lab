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
import { RecordsService } from './records.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Controller('databases/:dbId/tables/:tableName/records')
@UseGuards(AuthGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Body() createDto: CreateRecordDto,
  ) {
    const records = await this.recordsService.create(
      dbId,
      user.userId,
      tableName,
      createDto.data,
    );

    return records;
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
  ) {
    const records = await this.recordsService.findAll(
      dbId,
      user.userId,
      tableName,
    );

    return {
      count: records.length,
      records: records.map((record) => ({
        id: record.id,
        data: record.data,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Param('id') id: string,
  ) {
    const record = await this.recordsService.findOne(
      dbId,
      user.userId,
      tableName,
      id,
    );

    return {
      id: record.id,
      data: record.data,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateRecordDto,
  ) {
    const record = await this.recordsService.update(
      dbId,
      user.userId,
      tableName,
      id,
      updateDto.data,
    );

    return {
      id: record.id,
      data: record.data,
      updatedAt: record.updatedAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dbId') dbId: string,
    @Param('tableName') tableName: string,
    @Param('id') id: string,
  ) {
    await this.recordsService.remove(dbId, user.userId, tableName, id);
  }
}
