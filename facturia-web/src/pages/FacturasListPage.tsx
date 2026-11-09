import { Link, useSearchParams } from 'react-router';
import { FacturasFilters, type FilterValues } from '../components/facturas/FacturasFilters';
import { FacturasTable } from '../components/facturas/FacturasTable';
import { Pagination } from '../components/ui/Pagination';
import { useFacturas } from '../hooks/useFacturas';
import type { FacturaFilters } from '../models/factura';

export function FacturasListPage() {
  const [params, setParams] = useSearchParams();

  const filterValues: FilterValues = {
    proveedor: params.get('proveedor') ?? '',
    fechaDesde: params.get('fechaDesde') ?? '',
    fechaHasta: params.get('fechaHasta') ?? '',
  };
  const filters: FacturaFilters = {
    page: Number(params.get('page')) || 1,
    pageSize: Number(params.get('pageSize')) || 10,
    proveedor: filterValues.proveedor || undefined,
    fechaDesde: filterValues.fechaDesde || undefined,
    fechaHasta: filterValues.fechaHasta || undefined,
  };

  const { data, isLoading } = useFacturas(filters);

  // Updates the URL; empty values remove the parameter
  const updateParams = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  };

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1>Facturas</h1>
          <p className="muted">Facturas extraídas automáticamente y validadas.</p>
        </div>
        <Link to="/facturas/nueva" className="btn btn-primary">
          Cargar factura
        </Link>
      </div>

      <FacturasFilters
        key={params.toString()}
        values={filterValues}
        onApply={(values) => updateParams({ ...values, page: 1 })}
        onClear={() => setParams(new URLSearchParams())}
      />

      <section className="card table-card">
        {isLoading ? (
          <p className="empty muted">Cargando facturas…</p>
        ) : !data || data.total === 0 ? (
          <div className="empty stack">
            <p className="muted">No hay facturas para mostrar.</p>
            <div>
              <Link to="/facturas/nueva" className="btn btn-primary">
                Cargar la primera
              </Link>
            </div>
          </div>
        ) : (
          <>
            <FacturasTable facturas={data.data} />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={(page) => updateParams({ page })}
              onPageSizeChange={(pageSize) => updateParams({ pageSize, page: 1 })}
            />
          </>
        )}
      </section>
    </>
  );
}