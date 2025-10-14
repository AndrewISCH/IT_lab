import apiClient from "../client";
import type {
  Database,
  CreateDatabaseDto,
  UpdateDatabaseDto,
  Permission,
  GrantPermissionDto,
} from "../types";

export const databasesApi = {
  create: async (data: CreateDatabaseDto): Promise<Database> => {
    const response = await apiClient.post<Database>("/databases", data);
    return response.data;
  },

  getAll: async (): Promise<Database[]> => {
    const response = await apiClient.get<Database[]>("/databases");
    return response.data;
  },

  getById: async (id: string): Promise<Database> => {
    const response = await apiClient.get<Database>(`/databases/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateDatabaseDto): Promise<Database> => {
    const response = await apiClient.patch<Database>(`/databases/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/databases/${id}`);
  },

  grantPermission: async (
    id: string,
    data: GrantPermissionDto,
  ): Promise<Permission> => {
    const response = await apiClient.post<Permission>(
      `/databases/${id}/permissions`,
      data,
    );
    return response.data;
  },

  getPermissions: async (id: string): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>(
      `/databases/${id}/permissions`,
    );
    return response.data;
  },

  getMyPermissions: async (id: string): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>(
      `/databases/${id}/permissions/me`,
    );
    return response.data;
  },
};
