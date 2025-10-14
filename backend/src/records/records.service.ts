import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommunityDbService } from '../storage/community-db.service';
import { DatabasesService } from '../databases/databases.service';
import { TablesService } from '../tables/tables.service';
import { TypeValidator } from '../common/validators/type.validators';

import type {
  InsertionRecordsResponse,
  TableRecord,
} from '../common/types/table.interface';

@Injectable()
export class RecordsService {
  constructor(
    private readonly communityDbService: CommunityDbService,
    private readonly databasesService: DatabasesService,
    private readonly tablesService: TablesService,
  ) {}

  async create(
    databaseId: string,
    userId: string,
    tableName: string,
    data: Record<string, unknown>[],
  ): Promise<InsertionRecordsResponse> {
    const canEdit = await this.databasesService.canEditData(databaseId, userId);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit data');
    }

    const tableExists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!tableExists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    const schema = await this.tablesService.getSchema(
      databaseId,
      userId,
      tableName,
    );
    if (data.length === 0) {
      throw new BadRequestException({
        message: 'Data must be non empty',
      });
    }
    const parsedData = data.map((row) => {
      const rowWithDefaults = TypeValidator.applyDefaults(row, schema.columns);

      const validation = TypeValidator.validateRecord(
        rowWithDefaults,
        schema.columns,
      );

      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validation.errors,
        });
      }
      return rowWithDefaults;
    });

    await this.communityDbService.insertRecords(
      databaseId,
      tableName,
      parsedData,
      schema,
    );
    return {
      data: parsedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async findAll(
    databaseId: string,
    userId: string,
    tableName: string,
  ): Promise<TableRecord[]> {
    const hasAccess = await this.databasesService.hasAccess(databaseId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this database');
    }

    const tableExists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!tableExists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    return await this.communityDbService.loadTableRecords(
      databaseId,
      tableName,
    );
  }

  async findOne(
    databaseId: string,
    userId: string,
    tableName: string,
    recordId: string,
  ): Promise<TableRecord> {
    const hasAccess = await this.databasesService.hasAccess(databaseId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this database');
    }

    const tableExists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!tableExists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    const record = await this.communityDbService.loadTableRecordById(
      databaseId,
      tableName,
      recordId,
    );

    if (!record) {
      throw new NotFoundException(
        `Record with id '${recordId}' not found in table '${tableName}'`,
      );
    }

    return record;
  }

  async update(
    databaseId: string,
    userId: string,
    tableName: string,
    recordId: string,
    data: Record<string, unknown>,
  ): Promise<TableRecord> {
    const canEdit = await this.databasesService.canEditData(databaseId, userId);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit data');
    }

    const tableExists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!tableExists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    const existingRecord = await this.communityDbService.loadTableRecordById(
      databaseId,
      tableName,
      recordId,
    );

    if (!existingRecord) {
      throw new NotFoundException(
        `Record with id '${recordId}' not found in table '${tableName}'`,
      );
    }

    const schema = await this.tablesService.getSchema(
      databaseId,
      userId,
      tableName,
    );

    const partialValidation: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const column = schema.columns.find((col) => col.name === key);

      if (!column) {
        throw new BadRequestException(`Unknown column: '${key}'`);
      }

      if (column.isPrimaryKey && column.autoIncrement) {
        throw new BadRequestException(`Column: '${key}' cannot be modified!`);
      }

      if (!TypeValidator.validate(value, column)) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [TypeValidator.getValidationError(value, column)],
        });
      }

      partialValidation[key] = value;
    }
    // if we change id value, we should select row with new id instead of an old one
    const recordNewId = await this.communityDbService.updateRecord(
      databaseId,
      tableName,
      schema,
      recordId,
      partialValidation,
    );

    return await this.findOne(databaseId, userId, tableName, recordNewId);
  }

  async remove(
    databaseId: string,
    userId: string,
    tableName: string,
    recordId: string,
  ): Promise<void> {
    const canEdit = await this.databasesService.canEditData(databaseId, userId);
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to delete data');
    }

    const tableExists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!tableExists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    const existingRecord = await this.communityDbService.loadTableRecordById(
      databaseId,
      tableName,
      recordId,
    );

    if (!existingRecord) {
      throw new NotFoundException(
        `Record with id '${recordId}' not found in table '${tableName}'`,
      );
    }

    await this.communityDbService.deleteRecord(databaseId, tableName, recordId);
  }
}
