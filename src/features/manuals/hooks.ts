import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createManual, deleteManual, getManual, listManuals } from './api';
import { CreateManualInput, Manual } from './types';

const manualKeys = {
  all: ['manuals'] as const,
  list: (userId: string) => ['manuals', 'list', userId] as const,
  detail: (id: string) => ['manuals', id] as const,
};

export function useManuals(userId: string | undefined) {
  return useQuery<Manual[]>({
    queryKey: manualKeys.list(userId ?? ''),
    queryFn: () => listManuals(userId as string),
    enabled: Boolean(userId),
  });
}

export function useManual(id: string) {
  return useQuery<Manual | null>({
    queryKey: manualKeys.detail(id),
    queryFn: () => getManual(id),
    enabled: Boolean(id),
  });
}

export function useCreateManual() {
  const queryClient = useQueryClient();
  return useMutation<Manual, Error, CreateManualInput>({
    mutationFn: createManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manualKeys.all });
    },
  });
}

export function useDeleteManual() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; videoPath: string }>({
    mutationFn: deleteManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manualKeys.all });
    },
  });
}
