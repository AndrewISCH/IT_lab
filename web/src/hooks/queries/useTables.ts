import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {tablesApi} from "../../api/endpoints/tables";
import type {
  CreateTableDto,
  RenameColumnDto,
  ReorderColumnsDto,
  UpdateSchemaDto,
} from "../../api/types";

export const tableKeys = {
  all: (dbId: string) => ["databases", dbId, "tables"] as const,
  detail: (dbId: string, tableName: string) =>
    ["databases", dbId, "tables", tableName] as const,
};

export const useTables = (dbId: string) => {
  return useQuery({
    queryKey: tableKeys.all(dbId),
    queryFn: () => tablesApi.getAll(dbId),
    enabled: !!dbId,
  });
};

export const useTableSchema = (dbId: string, tableName: string) => {
  return useQuery({
    queryKey: tableKeys.detail(dbId, tableName),
    queryFn: () => tablesApi.getSchema(dbId, tableName),
    enabled: !!dbId && !!tableName,
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({dbId, data}: {dbId: string; data: CreateTableDto}) =>
      tablesApi.create(dbId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: tableKeys.all(variables.dbId)});
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({dbId, tableName}: {dbId: string; tableName: string}) =>
      tablesApi.delete(dbId, tableName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: tableKeys.all(variables.dbId)});
    },
  });
};

export const useRenameColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbId,
      tableName,
      data,
    }: {
      dbId: string;
      tableName: string;
      data: RenameColumnDto;
    }) => tablesApi.renameColumn(dbId, tableName, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tableKeys.detail(variables.dbId, variables.tableName),
      });
      queryClient.invalidateQueries({queryKey: tableKeys.all(variables.dbId)});
    },
  });
};

export const useReorderColumns = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbId,
      tableName,
      data,
    }: {
      dbId: string;
      tableName: string;
      data: ReorderColumnsDto;
    }) => tablesApi.reorderColumns(dbId, tableName, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tableKeys.detail(variables.dbId, variables.tableName),
      });
    },
  });
};

export const useUpdateSchema = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbId,
      tableName,
      data,
    }: {
      dbId: string;
      tableName: string;
      data: UpdateSchemaDto;
    }) => tablesApi.updateSchema(dbId, tableName, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tableKeys.detail(variables.dbId, variables.tableName),
      });
      queryClient.invalidateQueries({queryKey: tableKeys.all(variables.dbId)});
    },
  });
};
