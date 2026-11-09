import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { ResumenTable } from '../components/reportes/ResumenTable';
import { useResumen } from '../hooks/useResumen';
import { formatCurrency } from '../utils/format';

export function ResumenPage() {
  const [params, setParams] = useSearchParams();
  const fechaDesde = params.get('fechaDesde') ?? '';
  const fechaHasta = params.get('fechaHasta') ?? '';
  const { data, isLoading } = useResumen({
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['fechaDesde', 'fechaHasta']) {
      const value = String(form.get(key) ?? '');
      if (value) next.set(key, value);
    }
    setParams(next);
  };

  return (
    <>
      <header className="page-header">
        <h1>Reporte resumen</h1>
        <p className="muted">Total facturado por proveedor, mes y moneda. Las monedas nunca se suman entre sí.</p>
      </header>

      <form key={params.toString()} className="card filters" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fechaDesde">Desde</label>
          <input id="fechaDesde" name="fechaDesde" type="date" className="input" defaultValue={fechaDesde} />
        </div>
        <div className="field">
          <label htmlFor="fechaHasta">Hasta</label>
          <input id="fechaHasta" name="fechaHasta" type="date" className="input" defaultValue={fechaHasta} />
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => setParams(new URLSearchParams())}>
            Limpiar
          </button>
          <button type="submit" className="btn btn-primary">
            Aplicar
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="muted">Cargando reporte…</p>
      ) : !data || data.data.length === 0 ? (
        <p className="card empty muted">No hay facturas en este periodo.</p>
      ) : (
        <>
          <div className="stats">
            {data.totalsByCurrency.map((total) => (
              <div key={total.moneda} className="card">
                <p className="muted">Total en {total.moneda}</p>
                <p className="stat-value">{formatCurrency(total.total, total.moneda)}</p>
                <p className="muted">
                  {total.cantidad} {total.cantidad === 1 ? 'factura' : 'facturas'}
                </p>
              </div>
            ))}
          </div>
          <section className="card table-card">
            <ResumenTable rows={data.data} />
          </section>
        </>
      )}
    </>
  );
}