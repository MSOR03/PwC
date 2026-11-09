import { Link } from 'react-router';
import type { Factura } from '../../models/factura';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props {
  factura: Factura;
  onUploadAnother: () => void;
}

export function ExtractionResult({ factura, onUploadAnother }: Props) {
  return (
    <div className="card stack">
      <h2 className="success-title">Factura registrada</h2>
      <dl className="data-list">
        <div>
          <dt>Proveedor</dt>
          <dd>{factura.proveedor.nombre}</dd>
        </div>
        <div>
          <dt>N.º de factura</dt>
          <dd>{factura.numeroFactura}</dd>
        </div>
        <div>
          <dt>Fecha de emisión</dt>
          <dd>{formatDate(factura.fechaEmision)}</dd>
        </div>
        <div>
          <dt>Fecha límite de pago</dt>
          <dd>{formatDate(factura.fechaLimitePago)}</dd>
        </div>
        <div>
          <dt>Valor total</dt>
          <dd>{formatCurrency(factura.valorTotal, factura.moneda)}</dd>
        </div>
        <div>
          <dt>N.º cliente / contrato</dt>
          <dd>{factura.numeroCliente ?? '—'}</dd>
        </div>
      </dl>
      <div className="actions">
        <button type="button" className="btn" onClick={onUploadAnother}>
          Cargar otra
        </button>
        <Link to={`/facturas/${factura.id}`} className="btn btn-primary">
          Revisar y editar
        </Link>
      </div>
    </div>
  );
}