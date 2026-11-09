import type { SummaryRow } from '../../models/resumen';
import { formatCurrency, formatMonth } from '../../utils/format';

export function ResumenTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Mes</th>
            <th>Proveedor</th>
            <th>Moneda</th>
            <th className="num">Facturas</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.mes}-${row.proveedorId}-${row.moneda}`}>
              <td>{formatMonth(row.mes)}</td>
              <td>{row.proveedor}</td>
              <td>
                <span className="badge badge-muted">{row.moneda}</span>
              </td>
              <td className="num">{row.cantidad}</td>
              <td className="num">
                <strong>{formatCurrency(row.total, row.moneda)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}