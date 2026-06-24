import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createManual, getManual, listManuals } from './api';
import { CreateManualInput, Manual } from './types';

const manualKeys = {
  all: ['manuals'] as const,
  detail: (id: string) => ['manuals', id] as const,
};

export function useManuals() {
  return useQuery<Manual[]>({
    queryKey: manualKeys.all,
    queryFn: listManuals,
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
