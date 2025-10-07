import { ColumnDefinition, ColumnValue } from './column.interface';

export interface TableSchema {
  name: string;
  createdAt: string;
  updatedAt: string;
  isDropped: boolean;
  nextId: number;
  withPK: boolean;
  columns: ColumnDefinition[];
}
export interface InsertionRecordsResponse {
  data: ColumnValue[];
  createdAt: string;
  updatedAt: string;
}

export interface TableRecord {
  id: string;
  data: ColumnValue;
  createdAt: string;
  updatedAt: string;
}

export interface TableData {
  schema: TableSchema;
  records: TableRecord[];
}

export interface TableMetadata {
  name: string;
  createdAt: string;
  updatedAt: string;
  isDropped: boolean;
  columnCount: number;
  recordCount: number;
}

export interface TableListItem {
  name: string;
  columnCount: number;
  recordCount: number;
  createdAt: string;
}
