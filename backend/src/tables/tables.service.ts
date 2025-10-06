import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CommunityDbService } from '../storage/community-db.service';
import { DatabasesService } from '../databases/databases.service';
import type { ColumnDefinition } from '../common/types/column.interface';
import type {
  TableSchema,
  TableMetadata,
} from '../common/types/table.interface';
import { CreateColumnDto } from './dto/create-column.dto';

@Injectable()
export class TablesService {
  constructor(
    private readonly communityDbService: CommunityDbService,
    private readonly databasesService: DatabasesService,
  ) {}

  async create(
    databaseId: string,
    userId: string,
    tableName: string,
    columns: CreateColumnDto[],
  ): Promise<TableSchema> {
    const canModify = await this.databasesService.canModifySchema(
      databaseId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify schema',
      );
    }

    this.validateColumns(columns);

    const exists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (exists) {
      throw new BadRequestException(`Table '${tableName}' already exists`);
    }

    const columnsWithPosition = columns.map((col, index) => ({
      ...col,
      position: col.position ?? index,
      nullable: col.nullable ?? false,
    }));

    await this.communityDbService.createTable(
      databaseId,
      tableName,
      columnsWithPosition,
    );

    return await this.communityDbService.loadTableSchema(databaseId, tableName);
  }

  async getSchema(
    databaseId: string,
    userId: string,
    tableName: string,
  ): Promise<TableSchema> {
    const hasAccess = await this.databasesService.hasAccess(databaseId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this database');
    }

    const exists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!exists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    return await this.communityDbService.loadTableSchema(databaseId, tableName);
  }

  async listTables(
    databaseId: string,
    userId: string,
  ): Promise<TableMetadata[]> {
    const hasAccess = await this.databasesService.hasAccess(databaseId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this database');
    }

    const tables = await this.communityDbService.listTables(databaseId);

    const tablesWithMetadata = await Promise.all(
      tables.map(async (table) => {
        const schema = await this.communityDbService.loadTableSchema(
          databaseId,
          table.name,
        );
        const records = await this.communityDbService.loadTableRecords(
          databaseId,
          table.name,
        );

        return {
          name: table.name,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          isDropped: table.isDropped,
          columnCount: schema.columns.length,
          recordCount: records.length,
        };
      }),
    );

    return tablesWithMetadata;
  }

  async drop(
    databaseId: string,
    userId: string,
    tableName: string,
  ): Promise<void> {
    const canModify = await this.databasesService.canModifySchema(
      databaseId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to drop tables');
    }

    const exists = await this.communityDbService.tableExists(
      databaseId,
      tableName,
    );
    if (!exists) {
      throw new NotFoundException(`Table '${tableName}' not found`);
    }

    await this.communityDbService.dropTable(databaseId, tableName);
  }

  async renameColumn(
    databaseId: string,
    userId: string,
    tableName: string,
    oldName: string,
    newName: string,
  ): Promise<TableSchema> {
    const canModify = await this.databasesService.canModifySchema(
      databaseId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify schema',
      );
    }

    const schema = await this.communityDbService.loadTableSchema(
      databaseId,
      tableName,
    );

    const column = schema.columns.find((col) => col.name === oldName);
    if (!column) {
      throw new NotFoundException(
        `Column '${oldName}' not found in table '${tableName}'`,
      );
    }

    if (oldName !== newName) {
      const conflicting = schema.columns.find((col) => col.name === newName);
      if (conflicting) {
        throw new BadRequestException(
          `Column '${newName}' already exists in table '${tableName}'`,
        );
      }
    }

    await this.communityDbService.renameColumn(
      databaseId,
      tableName,
      oldName,
      newName,
    );

    return await this.communityDbService.loadTableSchema(databaseId, tableName);
  }

  async reorderColumns(
    databaseId: string,
    userId: string,
    tableName: string,
    columnOrder: string[],
  ): Promise<TableSchema> {
    const canModify = await this.databasesService.canModifySchema(
      databaseId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify schema',
      );
    }

    const schema = await this.communityDbService.loadTableSchema(
      databaseId,
      tableName,
    );

    const existingNames = schema.columns.map((col) => col.name).sort();
    const newNames = [...columnOrder].sort();

    if (existingNames.length !== newNames.length) {
      throw new BadRequestException(
        `Column count mismatch: expected ${existingNames.length}, got ${newNames.length}`,
      );
    }

    for (let i = 0; i < existingNames.length; i++) {
      if (existingNames[i] !== newNames[i]) {
        throw new BadRequestException(
          `Column order must include all existing columns. Missing or extra: ${existingNames[i]} vs ${newNames[i]}`,
        );
      }
    }

    await this.communityDbService.reorderColumns(
      databaseId,
      tableName,
      columnOrder,
    );

    return await this.communityDbService.loadTableSchema(databaseId, tableName);
  }

  async updateSchema(
    databaseId: string,
    userId: string,
    tableName: string,
    updates: Array<{ oldName: string; newName?: string; position: number }>,
  ): Promise<TableSchema> {
    const canModify = await this.databasesService.canModifySchema(
      databaseId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify schema',
      );
    }

    const schema = await this.communityDbService.loadTableSchema(
      databaseId,
      tableName,
    );

    if (updates.length !== schema.columns.length) {
      throw new BadRequestException(
        `Updates must include all columns. Expected ${schema.columns.length}, got ${updates.length}`,
      );
    }

    const positions = updates.map((u) => u.position);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      throw new BadRequestException('Column positions must be unique');
    }

    const sortedPositions = [...positions].sort((a, b) => a - b);
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i) {
        throw new BadRequestException(
          `Invalid positions: must be consecutive starting from 0. Got: ${sortedPositions.join(', ')}`,
        );
      }
    }

    const existingNames = new Set(schema.columns.map((col) => col.name));
    for (const update of updates) {
      if (!existingNames.has(update.oldName)) {
        throw new NotFoundException(
          `Column '${update.oldName}' not found in table '${tableName}'`,
        );
      }
    }

    const newNames = updates.map((u) => u.newName || u.oldName);
    const uniqueNewNames = new Set(newNames);
    if (uniqueNewNames.size !== newNames.length) {
      throw new BadRequestException('Duplicate column names in updates');
    }

    for (const update of updates) {
      if (update.newName && update.newName !== update.oldName) {
        await this.communityDbService.renameColumn(
          databaseId,
          tableName,
          update.oldName,
          update.newName,
        );
      }
    }

    const newOrder = updates
      .sort((a, b) => a.position - b.position)
      .map((u) => u.newName || u.oldName);

    await this.communityDbService.reorderColumns(
      databaseId,
      tableName,
      newOrder,
    );

    return await this.communityDbService.loadTableSchema(databaseId, tableName);
  }

  private validateColumns(
    columns: ColumnDefinition[] | CreateColumnDto[],
  ): void {
    if (columns.length === 0) {
      throw new BadRequestException('Table must have at least one column');
    }

    const names = columns.map(
      (col: ColumnDefinition | CreateColumnDto) => col.name,
    );
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      throw new BadRequestException('Column names must be unique');
    }

    const reserved = ['__id__', '__created_at__', '__updated_at__'];
    for (const col of columns) {
      if (reserved.includes(col.name)) {
        throw new BadRequestException(
          `Column name '${col.name}' is reserved for system use`,
        );
      }
    }

    for (const col of columns) {
      if (!col.name || col.name.trim().length === 0) {
        throw new BadRequestException('Column name cannot be empty');
      }
    }
  }
}
