import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { getCommunityDbPath } from '../config/database.config';
import type { ColumnDefinition } from '../common/types/column.interface';
import type { TableSchema, TableRecord } from '../common/types/table.interface';
import { DataType, TypeConfig } from '../common/types/data-types.enum';

type DbTableRow = {
  name: string;
  created_at: string;
  updated_at: string;
  next_id: number;
  with_pk: boolean;
  is_dropped: number;
};

type QueryParamConfig = {
  withPK: boolean;
  PK_key: string | undefined;
  isAutoIncrement: boolean;
  incrementedId: number;
};

type DbColumnRow = {
  id: string;
  table_name: string;
  column_name: string;
  position: number;
  data_type: string;
  nullable: number;
  auto_increment: boolean;
  is_primary_key: boolean;
  default_value: string | null;
  type_config: string | null;
};

type DbRecordRow = {
  __id__: string;
  __created_at__: string;
  __updated_at__: string;
  [key: string]: unknown;
};

type DbConnection = {
  dataSource: DataSource;
  cleanupTimeout: NodeJS.Timeout;
};

@Injectable()
export class CommunityDbService implements OnModuleDestroy {
  private readonly logger = new Logger(CommunityDbService.name);
  private readonly connections = new Map<string, DbConnection>();
  private readonly CLEANUP_DELAY = 5 * 60 * 1000;

  private scheduleCleanup(databaseId: string): NodeJS.Timeout {
    return setTimeout(() => {
      this.logger.log(`Auto-closing inactive connection: ${databaseId}`);
      void this.closeConnection(databaseId);
    }, this.CLEANUP_DELAY);
  }

  private resetCleanupTimer(databaseId: string): void {
    const conn = this.connections.get(databaseId);
    if (conn) {
      clearTimeout(conn.cleanupTimeout);
      conn.cleanupTimeout = this.scheduleCleanup(databaseId);
    }
  }

  private getInsertQueryParams(
    row: Record<string, unknown>,
    { withPK, PK_key, isAutoIncrement, incrementedId }: QueryParamConfig,
  ) {
    const id =
      withPK && !isAutoIncrement && PK_key ? row[PK_key] : incrementedId;
    const adjustedColumn = withPK && isAutoIncrement && PK_key;
    // manually adding column with autoincrementing pk for row object
    if (adjustedColumn) {
      Object.assign(row, { [PK_key]: id });
    }

    const now = new Date().toISOString();
    const columns = [
      '__id__',
      '__created_at__',
      '__updated_at__',
      ...Object.keys(row),
    ];
    const values = [id, now, now, ...Object.values(row)];
    const placeholders = columns.map(() => '?').join(', ');

    return {
      values,
      placeholders,
      columns,
    };
  }

  async getConnection(databaseId: string): Promise<DataSource> {
    if (this.connections.has(databaseId)) {
      const conn = this.connections.get(databaseId)!;
      if (conn.dataSource.isInitialized) {
        this.resetCleanupTimer(databaseId);
        return conn.dataSource;
      }
    }

    const dbPath = getCommunityDbPath(databaseId);
    const dataSource = new DataSource({
      type: 'sqlite',
      database: dbPath,
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();

    this.connections.set(databaseId, {
      dataSource,
      cleanupTimeout: this.scheduleCleanup(databaseId),
    });

    this.logger.log(`Connected to database: ${databaseId}`);

    return dataSource;
  }

  async closeConnection(databaseId: string): Promise<void> {
    const conn = this.connections.get(databaseId);
    if (conn) {
      clearTimeout(conn.cleanupTimeout);

      if (conn.dataSource.isInitialized) {
        await conn.dataSource.destroy();
        this.logger.log(`Closed connection to database: ${databaseId}`);
      }

      this.connections.delete(databaseId);
    }
  }

  async initializeDatabase(databaseId: string): Promise<void> {
    const connection = await this.getConnection(databaseId);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS __tables__ (
        name TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        next_id INTEGER DEFAULT 0,
        with_pk INTEGER DEFAULT 0,
        is_dropped INTEGER DEFAULT 0
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS __columns__ (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        column_name TEXT NOT NULL,
        position INTEGER NOT NULL,
        data_type TEXT NOT NULL,
        nullable INTEGER NOT NULL,
        is_primary_key INTEGER,
        auto_increment INTEGER,
        default_value TEXT,
        type_config TEXT,
        FOREIGN KEY (table_name) REFERENCES __tables__(name),
        UNIQUE(table_name, column_name)
      )
    `);

    this.logger.log(`Initialized database: ${databaseId}`);
  }

  async createTable(
    databaseId: string,
    tableName: string,
    columns: ColumnDefinition[],
  ): Promise<void> {
    const connection = await this.getConnection(databaseId);
    const now = new Date().toISOString();

    await connection.transaction(async (manager) => {
      const withPK = columns.some(
        (column: ColumnDefinition) => column.isPrimaryKey ?? false,
      );
      await manager.query(
        `INSERT INTO __tables__ (name, created_at, updated_at, with_pk, next_id, is_dropped) VALUES (?, ?, ?, ?, 0, 0)`,
        [tableName, now, now, withPK],
      );

      for (const column of columns) {
        await manager.query(
          `INSERT INTO __columns__ (id, table_name, column_name, position, data_type, nullable, default_value, type_config, is_primary_key, auto_increment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${tableName}_${column.name}`,
            tableName,
            column.name,
            column.position,
            column.type,
            column.nullable ? 1 : 0,
            column.defaultValue ? JSON.stringify(column.defaultValue) : null,
            column.typeConfig ? JSON.stringify(column.typeConfig) : null,
            column.isPrimaryKey ? 1 : 0,
            column.autoIncrement ? 1 : 0,
          ],
        );
      }

      const columnDefs = columns
        .map((col) => `"${col.name}" ${this.getSqlType(col.type)}`)
        .join(', ');

      await manager.query(`
        CREATE TABLE "${tableName}" (
          __id__ TEXT PRIMARY KEY,
          __created_at__ TEXT NOT NULL,
          __updated_at__ TEXT NOT NULL,
          ${columnDefs}
        )
      `);
    });

    this.logger.log(`Created table: ${databaseId}.${tableName}`);
  }

  async listTables(databaseId: string): Promise<
    Array<{
      name: string;
      createdAt: string;
      updatedAt: string;
      isDropped: boolean;
    }>
  > {
    const connection = await this.getConnection(databaseId);

    const rows = await connection.query<DbTableRow[]>(
      `SELECT name, created_at, updated_at, is_dropped FROM __tables__ WHERE is_dropped = 0`,
    );

    return rows.map((row) => ({
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDropped: row.is_dropped === 1,
    }));
  }

  async tableExists(databaseId: string, tableName: string): Promise<boolean> {
    const connection = await this.getConnection(databaseId);

    const rows = await connection.query<DbTableRow[]>(
      `SELECT name FROM __tables__ WHERE name = ? AND is_dropped = 0`,
      [tableName],
    );

    return rows.length > 0;
  }

  async loadTableSchema(
    databaseId: string,
    tableName: string,
  ): Promise<TableSchema> {
    const connection = await this.getConnection(databaseId);

    const tableRows = await connection.query<DbTableRow[]>(
      `SELECT * FROM __tables__ WHERE name = ?`,
      [tableName],
    );

    if (tableRows.length === 0) {
      throw new Error(`Table not found: ${tableName}`);
    }

    const tableData = tableRows[0];

    const columnRows = await connection.query<DbColumnRow[]>(
      `SELECT * FROM __columns__ WHERE table_name = ? ORDER BY position`,
      [tableName],
    );

    const columns: ColumnDefinition[] = columnRows.map((row) => ({
      name: row.column_name,
      position: row.position,
      type: row.data_type as DataType,
      nullable: row.nullable === 1,
      isPrimaryKey: row.is_primary_key,
      autoIncrement: row.auto_increment,
      defaultValue: row.default_value
        ? (JSON.parse(row.default_value) as unknown)
        : undefined,
      typeConfig: row.type_config
        ? (JSON.parse(row.type_config) as TypeConfig)
        : undefined,
    }));

    return {
      name: tableData.name,
      createdAt: tableData.created_at,
      updatedAt: tableData.updated_at,
      isDropped: tableData.is_dropped === 1,
      nextId: tableData.next_id,
      withPK: tableData.with_pk,
      columns,
    };
  }

  async loadTableRecords(
    databaseId: string,
    tableName: string,
  ): Promise<TableRecord[]> {
    const connection = await this.getConnection(databaseId);

    const rows = await connection.query<DbRecordRow[]>(
      `SELECT * FROM "${tableName}"`,
    );

    return rows.map((row) => {
      const { __id__, __created_at__, __updated_at__, ...data } = row;
      return {
        id: __id__,
        createdAt: __created_at__,
        updatedAt: __updated_at__,
        data,
      };
    });
  }

  async loadTableRecordById(
    databaseId: string,
    tableName: string,
    recordId: string,
  ): Promise<TableRecord | null> {
    const connection = await this.getConnection(databaseId);

    const rows = await connection.query<DbRecordRow[]>(
      `SELECT * FROM "${tableName}" WHERE __id__ = ?`,
      [recordId],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const { __id__, __created_at__, __updated_at__, ...data } = row;

    return {
      id: __id__,
      createdAt: __created_at__,
      updatedAt: __updated_at__,
      data,
    };
  }

  async insertRecords(
    databaseId: string,
    tableName: string,
    rows: Record<string, unknown>[],
    schema: TableSchema,
  ): Promise<void> {
    const connection = await this.getConnection(databaseId);
    const withPK = schema.withPK;
    const PK_key = schema.columns.find((column) => column.isPrimaryKey)?.name;
    const isAutoIncrement =
      withPK && schema.columns.some((column) => column.autoIncrement);
    const updatedNextID = schema.nextId + rows.length;
    try {
      await connection.transaction(async (manager) => {
        const insertPromises = rows.map((row, ind) => {
          const { columns, values, placeholders } = this.getInsertQueryParams(
            row,
            {
              withPK,
              PK_key,
              isAutoIncrement,
              incrementedId: schema.nextId + ind,
            },
          );

          return manager.query(
            `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')})
         VALUES (${placeholders})`,
            values,
          );
        });

        await Promise.all(insertPromises);
        if (isAutoIncrement) {
          await manager.query(
            `UPDATE __tables__ SET  next_id = ?, updated_at = ? WHERE name = ?`,
            [updatedNextID, new Date().toISOString(), tableName],
          );
        }
      });
    } catch (err) {
      throw new BadRequestException(`Error during executing SQL query: ${err}`);
    }
  }

  async updateRecord(
    databaseId: string,
    tableName: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const connection = await this.getConnection(databaseId);
    const now = new Date().toISOString();

    const setClauses = Object.keys(data)
      .map((key) => `"${key}" = ?`)
      .join(', ');

    await connection.query(
      `UPDATE "${tableName}"
       SET ${setClauses}, __updated_at__ = ?
       WHERE __id__ = ?`,
      [...Object.values(data), now, id],
    );
  }

  async deleteRecord(
    databaseId: string,
    tableName: string,
    id: string,
  ): Promise<void> {
    const connection = await this.getConnection(databaseId);
    await connection.query(`DELETE FROM "${tableName}" WHERE __id__ = ?`, [id]);
  }

  async dropTable(databaseId: string, tableName: string): Promise<void> {
    const connection = await this.getConnection(databaseId);

    await connection.transaction(async (manager) => {
      await manager.query(
        `UPDATE __tables__ SET is_dropped = 1, updated_at = ? WHERE name = ?`,
        [new Date().toISOString(), tableName],
      );

      await manager.query(`DROP TABLE IF EXISTS "${tableName}"`);
    });

    this.logger.log(`Dropped table: ${databaseId}.${tableName}`);
  }

  async renameColumn(
    databaseId: string,
    tableName: string,
    oldName: string,
    newName: string,
  ): Promise<void> {
    const connection = await this.getConnection(databaseId);

    await connection.transaction(async (manager) => {
      await manager.query(
        `UPDATE __columns__ SET column_name = ?, id = ? WHERE table_name = ? AND column_name = ?`,
        [newName, `${tableName}_${newName}`, tableName, oldName],
      );

      await this.recreateTableWithNewSchema(manager, databaseId, tableName);
    });

    this.logger.log(
      `Renamed column: ${databaseId}.${tableName}.${oldName} -> ${newName}`,
    );
  }

  async reorderColumns(
    databaseId: string,
    tableName: string,
    newOrder: string[],
  ): Promise<void> {
    const connection = await this.getConnection(databaseId);

    await connection.transaction(async (manager) => {
      for (let i = 0; i < newOrder.length; i++) {
        await manager.query(
          `UPDATE __columns__ SET position = ? WHERE table_name = ? AND column_name = ?`,
          [i, tableName, newOrder[i]],
        );
      }
    });

    this.logger.log(`Reordered columns: ${databaseId}.${tableName}`);
  }

  private getSqlType(dataType: DataType): string {
    switch (dataType) {
      case DataType.INTEGER:
        return 'INTEGER';
      case DataType.REAL:
        return 'REAL';
      case DataType.CHAR:
      case DataType.STRING:
      case DataType.CHAR_INTERVAL:
      case DataType.STRING_CHAR_INTERVAL:
        return 'TEXT';
      default:
        return 'TEXT';
    }
  }

  private async recreateTableWithNewSchema(
    manager: EntityManager,
    databaseId: string,
    tableName: string,
  ): Promise<void> {
    const schema = await this.loadTableSchema(databaseId, tableName);
    const records = await this.loadTableRecords(databaseId, tableName);

    const tempTableName = `${tableName}_temp`;
    const columnDefs = schema.columns
      .map((col) => `"${col.name}" ${this.getSqlType(col.type)}`)
      .join(', ');

    await manager.query(`
      CREATE TABLE "${tempTableName}" (
        __id__ TEXT PRIMARY KEY,
        __created_at__ TEXT NOT NULL,
        __updated_at__ TEXT NOT NULL,
        ${columnDefs}
      )
    `);

    for (const record of records) {
      const columns = [
        '__id__',
        '__created_at__',
        '__updated_at__',
        ...Object.keys(record.data),
      ];
      const values = [
        record.id,
        record.createdAt,
        record.updatedAt,
        ...Object.values(record.data),
      ];
      const placeholders = columns.map(() => '?').join(', ');

      await manager.query(
        `INSERT INTO "${tempTableName}" (${columns.map((c) => `"${c}"`).join(', ')})
         VALUES (${placeholders})`,
        values,
      );
    }

    await manager.query(`DROP TABLE "${tableName}"`);
    await manager.query(
      `ALTER TABLE "${tempTableName}" RENAME TO "${tableName}"`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    for (const [databaseId, conn] of this.connections.entries()) {
      clearTimeout(conn.cleanupTimeout);

      if (conn.dataSource.isInitialized) {
        await conn.dataSource.destroy();
        this.logger.log(`Closed connection: ${databaseId}`);
      }
    }

    this.connections.clear();
  }
}
