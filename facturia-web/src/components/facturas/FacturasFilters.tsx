import type { FormEvent } from 'react';

export interface FilterValues {
  proveedor: string;
  fechaDesde: string;
  fechaHasta: string;
}

interface Props {
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
}

export function FacturasFilters({ values, onApply, onClear }: Props) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onApply({
      proveedor: String(form.get('proveedor') ?? '').trim(),
      fechaDesde: String(form.get('fechaDesde') ?? ''),
      fechaHasta: String(form.get('fechaHasta') ?? ''),
    });
  };

  return (
    <form className="card filters" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="proveedor">Proveedor</label>
        <input id="proveedor" name="proveedor" className="input" defaultValue={values.proveedor} placeholder="Ej. energía" />
      </div>
      <div className="field">
        <label htmlFor="fechaDesde">Desde</label>
        <input id="fechaDesde" name="fechaDesde" type="date" className="input" defaultValue={values.fechaDesde} />
      </div>
      <div className="field">
        <label htmlFor="fechaHasta">Hasta</label>
        <input id="fechaHasta" name="fechaHasta" type="date" className="input" defaultValue={values.fechaHasta} />
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onClear}>
          Limpiar
        </button>
        <button type="submit" className="btn btn-primary">
          Filtrar
        </button>
      </div>
    </form>
  );
}