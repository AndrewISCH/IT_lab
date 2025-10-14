import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {recordsApi} from "../../api/endpoints/records";
import type {CreateRecordDto, UpdateRecordDto} from "../../api/types";

export const recordKeys = {
  all: (dbId: string, tableName: string) =>
    ["databases", dbId, "tables", tableName, "records"] as const,
  detail: (dbId: string, tableName: string, id: string) =>
    ["databases", dbId, "tables", tableName, "records", id] as const,
};

export const useRecords = (dbId: string, tableName: string) => {
  return useQuery({
    queryKey: recordKeys.all(dbId, tableName),
    queryFn: () => recordsApi.getAll(dbId, tableName),
    enabled: !!dbId && !!tableName,
  });
};

export const useRecord = (dbId: string, tableName: string, id: string) => {
  return useQuery({
    queryKey: recordKeys.detail(dbId, tableName, id),
    queryFn: () => recordsApi.getById(dbId, tableName, id),
    enabled: !!dbId && !!tableName && !!id,
  });
};

export const useCreateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbId,
      tableName,
      data,
    }: {
      dbId: string;
      tableName: string;
      data: CreateRecordDto;
    }) => recordsApi.create(dbId, tableName, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: recordKeys.all(variables.dbId, variables.tableName),
      });
    },
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbId,
      tableName,
      id,
      data,
    }: {
      dbId: string;
      tableName: string;
      id: string;
      data: UpdateRecordDto;
    }) => recordsApi.update(dbId, tableName, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: recordKeys.detail(
          variables.dbId,
          variables.tableName,
          variables.id,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: recordKeys.all(variables.dbId, variables.tableName),
      });
    },
  });
};

export const useDeleteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbId,
      tableName,
      id,
    }: {
      dbId: string;
      tableName: string;
      id: string;
    }) => recordsApi.delete(dbId, tableName, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: recordKeys.all(variables.dbId, variables.tableName),
      });
    },
  });
};
