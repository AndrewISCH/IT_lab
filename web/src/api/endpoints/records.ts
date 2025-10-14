import apiClient from "../client";
import type {
  TableRecord,
  CreateRecordDto,
  UpdateRecordDto,
  TableListResponse,
} from "../types";

export const recordsApi = {
  create: async (
    dbId: string,
    tableName: string,
    data: CreateRecordDto,
  ): Promise<TableRecord[]> => {
    const response = await apiClient.post<TableRecord[]>(
      `/databases/${dbId}/tables/${tableName}/records`,
      data,
    );
    return response.data;
  },

  getAll: async (
    dbId: string,
    tableName: string,
  ): Promise<TableListResponse> => {
    const response = await apiClient.get<TableListResponse>(
      `/databases/${dbId}/tables/${tableName}/records`,
    );
    return response.data;
  },

  getById: async (
    dbId: string,
    tableName: string,
    id: string,
  ): Promise<TableRecord> => {
    const response = await apiClient.get<TableRecord>(
      `/databases/${dbId}/tables/${tableName}/records/${id}`,
    );
    return response.data;
  },

  update: async (
    dbId: string,
    tableName: string,
    id: string,
    data: UpdateRecordDto,
  ): Promise<TableRecord> => {
    const response = await apiClient.patch<TableRecord>(
      `/databases/${dbId}/tables/${tableName}/records/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (
    dbId: string,
    tableName: string,
    id: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/databases/${dbId}/tables/${tableName}/records/${id}`,
    );
  },
};
