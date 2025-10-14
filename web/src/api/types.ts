export enum DataType {
  INTEGER = "integer",
  REAL = "real",
  CHAR = "char",
  STRING = "string",
  CHAR_INTERVAL = "charInvl",
  STRING_CHAR_INTERVAL = "stringCharInvl",
}

export enum DatabaseRole {
  OWNER = "owner",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface Database {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  userRole: DatabaseRole;
  permissions?: Permission[];
}

export interface CreateDatabaseDto {
  name: string;
  description?: string;
}

export interface UpdateDatabaseDto {
  name?: string;
  description?: string;
}

export interface Permission {
  id: string;
  userId: string;
  databaseId: string;
  role: DatabaseRole;
  grantedAt: string;
  grantedBy: string;
  user?: User;
  database?: Database;
  grantor?: User;
}

export interface GrantPermissionDto {
  userId: string;
  role: DatabaseRole;
}

export interface CharIntervalConfig {
  start: string;
  end: string;
}

export interface StringCharIntervalConfig {
  charInterval: CharIntervalConfig;
  minLength?: number;
  maxLength?: number;
}

export type TypeConfig = CharIntervalConfig | StringCharIntervalConfig | null;

export interface ColumnDefinition {
  name: string;
  position: number;
  type: DataType;
  nullable: boolean;
  defaultValue?: unknown;
  typeConfig?: TypeConfig;
  isPrimaryKey?: boolean;
  autoIncrement?: boolean;
}

export interface CreateColumnDto {
  name: string;
  type: DataType;
  nullable?: boolean;
  defaultValue?: unknown;
  isPrimaryKey?: boolean;
  autoIncrement?: boolean;
  typeConfig?: CharIntervalConfig | StringCharIntervalConfig;
}

export interface TableSchema {
  name: string;
  createdAt: string;
  updatedAt: string;
  isDropped: boolean;
  nextId: number;
  withPK: boolean;
  columns: ColumnDefinition[];
}

export interface TableListItem {
  name: string;
  columnCount: number;
  recordCount: number;
  createdAt: string;
}

export interface TableMetadata {
  name: string;
  createdAt: string;
  updatedAt: string;
  isDropped: boolean;
  columnCount: number;
  recordCount: number;
}

export interface CreateTableDto {
  name: string;
  columns: CreateColumnDto[];
}

export interface RenameColumnDto {
  oldName: string;
  newName: string;
}

export interface ReorderColumnsDto {
  columnOrder: string[];
}

export interface ColumnUpdateDto {
  oldName: string;
  newName?: string;
  position: number;
}

export interface UpdateSchemaDto {
  columns: ColumnUpdateDto[];
}

export interface ColumnValue {
  [columnName: string]: unknown;
}
export interface TableListResponse {
  records: TableRecord[];
  count: number;
}

export interface TableRecord {
  id: string;
  data: ColumnValue;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordDto {
  data: Record<string, unknown>[];
}

export interface UpdateRecordDto {
  data: Record<string, unknown>;
}

export interface InsertionRecordsResponse {
  data: ColumnValue[];
  createdAt: string;
  updatedAt: string;
}

export interface TableData {
  schema: TableSchema;
  records: TableRecord[];
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
