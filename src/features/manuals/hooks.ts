import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createManual, deleteManual, getManual, listManuals, updateManualTitle } from './api';
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
  return useMutation<void, Error, { id: string; videoPaths: string[] }>({
    mutationFn: deleteManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manualKeys.all });
    },
  });
}

export function useUpdateManual() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; title: string }>({
    mutationFn: updateManualTitle,
    onSuccess: (_result, { id, title }) => {
      // 서버 재조회를 기다리지 않고 캐시(목록·상세)를 즉시 패치 → 바로 반영
      queryClient.setQueriesData<Manual[] | Manual | null>({ queryKey: manualKeys.all }, (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map((m) => (m.id === id ? { ...m, title } : m));
        return old.id === id ? { ...old, title } : old;
      });
      queryClient.invalidateQueries({ queryKey: manualKeys.all });
    },
  });
}
