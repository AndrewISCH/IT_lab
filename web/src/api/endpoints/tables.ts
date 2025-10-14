import apiClient from "../client";
import type {
  TableListItem,
  CreateTableDto,
  TableSchema,
  RenameColumnDto,
  ReorderColumnsDto,
  UpdateSchemaDto,
} from "../types";

export const tablesApi = {
  create: async (dbId: string, data: CreateTableDto): Promise<TableSchema> => {
    const response = await apiClient.post<TableSchema>(
      `/databases/${dbId}/tables`,
      data,
    );
    return response.data;
  },

  getAll: async (dbId: string): Promise<TableListItem[]> => {
    const response = await apiClient.get<TableListItem[]>(
      `/databases/${dbId}/tables`,
    );
    return response.data;
  },

  getSchema: async (dbId: string, tableName: string): Promise<TableSchema> => {
    const response = await apiClient.get<TableSchema>(
      `/databases/${dbId}/tables/${tableName}`,
    );
    return response.data;
  },

  delete: async (dbId: string, tableName: string): Promise<void> => {
    await apiClient.delete(`/databases/${dbId}/tables/${tableName}`);
  },

  renameColumn: async (
    dbId: string,
    tableName: string,
    data: RenameColumnDto,
  ): Promise<TableSchema> => {
    const response = await apiClient.patch<TableSchema>(
      `/databases/${dbId}/tables/${tableName}/rename-column`,
      data,
    );
    return response.data;
  },

  reorderColumns: async (
    dbId: string,
    tableName: string,
    data: ReorderColumnsDto,
  ): Promise<TableSchema> => {
    const response = await apiClient.patch<TableSchema>(
      `/databases/${dbId}/tables/${tableName}/reorder-columns`,
      data,
    );
    return response.data;
  },

  updateSchema: async (
    dbId: string,
    tableName: string,
    data: UpdateSchemaDto,
  ): Promise<TableSchema> => {
    const response = await apiClient.patch<TableSchema>(
      `/databases/${dbId}/tables/${tableName}/schema`,
      data,
    );
    return response.data;
  },
};
