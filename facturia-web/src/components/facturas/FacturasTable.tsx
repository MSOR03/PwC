import { Link } from 'react-router';
import type { Factura } from '../../models/factura';
import { formatCurrency, formatDate } from '../../utils/format';

export function FacturasTable({ facturas }: { facturas: Factura[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>N.º factura</th>
            <th>Proveedor</th>
            <th>Emisión</th>
            <th>Vence</th>
            <th className="num">Total</th>
            <th>
              <span className="visually-hidden">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((factura) => (
            <tr key={factura.id}>
              <td>
                <strong>{factura.numeroFactura}</strong>{' '}
                {factura.editadaManualmente && <span className="badge-muted badge">Editada</span>}
              </td>
              <td>{factura.proveedor.nombre}</td>
              <td>{formatDate(factura.fechaEmision)}</td>
              <td>{formatDate(factura.fechaLimitePago)}</td>
              <td className="num">
                <strong>{formatCurrency(factura.valorTotal, factura.moneda)}</strong>
              </td>
              <td>
                <Link to={`/facturas/${factura.id}`}>Ver detalle</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}