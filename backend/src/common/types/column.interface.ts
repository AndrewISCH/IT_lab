import { DataType, TypeConfig } from './data-types.enum';

export interface ColumnDefinition {
  name: string;
  position: number;
  type: DataType;
  nullable: boolean;
  defaultValue?: unknown;
  typeConfig?: TypeConfig;
}

export interface ColumnValue {
  [columnName: string]: unknown;
}

export interface CreateColumnDto {
  name: string;
  type: DataType;
  nullable?: boolean;
  defaultValue?: any;
  typeConfig?: TypeConfig;
}

export interface RenameColumnDto {
  oldName: string;
  newName: string;
}

export interface ReorderColumnsDto {
  columnOrder: string[];
}

export interface UpdateSchemaDto {
  columns: {
    oldName: string;
    newName?: string;
    position: number;
  }[];
}
