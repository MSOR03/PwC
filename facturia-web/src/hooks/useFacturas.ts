import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FacturaFilters, FacturaUpdate } from '../models/factura';
import { facturasServices } from '../services/facturas.services';

export const facturaKeys = {
  all: ['facturas'] as const,
  lists: ['facturas', 'list'] as const,
  list: (filters: FacturaFilters) => ['facturas', 'list', filters] as const,
  detail: (id: string) => ['facturas', 'detail', id] as const,
};

// Hook to fetch a list of facturas based on filters
export function useFacturas(filters: FacturaFilters) {
  return useQuery({
    queryKey: facturaKeys.list(filters),
    queryFn: () => facturasServices.list(filters),
    placeholderData: keepPreviousData, // keeps the previous page visible while the next one loads
  });
}

// Hook to fetch a single factura by ID
export function useFactura(id: string) {
  return useQuery({
    queryKey: facturaKeys.detail(id),
    queryFn: () => facturasServices.getById(id),
    enabled: Boolean(id),
  });
}

// Hook to update a factura by ID
export function useUpdateFactura(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FacturaUpdate) => facturasServices.update(id, body),
    onSuccess: (factura) => {
      queryClient.setQueryData(facturaKeys.detail(id), factura);
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists });
      queryClient.invalidateQueries({ queryKey: ['resumen'] });
    },
  });
}

// Hook to delete a factura by ID
export function useDeleteFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturasServices.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: facturaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: facturaKeys.lists });
      queryClient.invalidateQueries({ queryKey: ['resumen'] });
    },
  });
}