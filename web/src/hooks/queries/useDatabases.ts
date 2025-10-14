import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {databasesApi} from "../../api/endpoints/databases";
import type {
  CreateDatabaseDto,
  UpdateDatabaseDto,
  GrantPermissionDto,
} from "../../api/types";

export const databaseKeys = {
  all: ["databases"] as const,
  detail: (id: string) => ["databases", id] as const,
  permissions: (id: string) => ["databases", id, "permissions"] as const,
};

export const useDatabases = () => {
  return useQuery({
    queryKey: databaseKeys.all,
    queryFn: databasesApi.getAll,
  });
};

export const useDatabase = (id: string) => {
  return useQuery({
    queryKey: databaseKeys.detail(id),
    queryFn: () => databasesApi.getById(id),
    enabled: !!id,
  });
};

export const useDatabasePermissions = (id: string) => {
  return useQuery({
    queryKey: databaseKeys.permissions(id),
    queryFn: () => databasesApi.getPermissions(id),
    enabled: !!id,
  });
};

export const useCreateDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDatabaseDto) => databasesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: databaseKeys.all});
    },
  });
};

export const useUpdateDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: UpdateDatabaseDto}) =>
      databasesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: databaseKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({queryKey: databaseKeys.all});
    },
  });
};

export const useDeleteDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => databasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: databaseKeys.all});
    },
  });
};

export const useGrantPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: GrantPermissionDto}) =>
      databasesApi.grantPermission(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: databaseKeys.permissions(variables.id),
      });
    },
  });
};
