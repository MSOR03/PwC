import { useQuery } from '@tanstack/react-query';
import type { DateRange } from '../models/resumen';
import { reportesService } from '../services/reportes.service';

export function useResumen(range: DateRange) {
  return useQuery({
    queryKey: ['resumen', range],
    queryFn: () => reportesService.getResumen(range),
  });
}