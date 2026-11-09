import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FacturaForm } from '../components/facturas/FacturasForm';
import { useToast } from '../components/ui/useToast';
import { useDeleteFactura, useFactura, useUpdateFactura } from '../hooks/useFacturas';
import { formatFileSize } from '../utils/file';

export function FacturaDetallePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: factura, isLoading, isError } = useFactura(id);
  const update = useUpdateFactura(id);
  const remove = useDeleteFactura();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading) return <p className="muted">Cargando factura…</p>;

  if (isError || !factura) {
    return (
      <div className="stack">
        <h1>Factura no encontrada</h1>
        <p className="muted">Puede que haya sido eliminada.</p>
        <div>
          <Link to="/facturas" className="btn">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    remove.mutate(factura.id, {
      onSuccess: () => {
        toast.success(`Factura ${factura.numeroFactura} eliminada`);
        navigate('/facturas');
      },
    });
  };

  return (
    <>
      <nav className="muted" aria-label="Ruta" style={{ marginBottom: 8 }}>
        <Link to="/facturas">Facturas</Link> / {factura.numeroFactura}
      </nav>

      <div className="page-header-row">
        <div>
          <h1>Factura {factura.numeroFactura}</h1>
          <span className={factura.editadaManualmente ? 'badge badge-muted' : 'badge'}>
            {factura.editadaManualmente ? 'Editada manualmente' : 'Extraída por IA'}
          </span>
        </div>

        {confirmingDelete ? (
          <div className="actions" role="group" aria-label="Confirmar eliminación">
            <span className="muted">¿Eliminar esta factura?</span>
            <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={remove.isPending}>
              {remove.isPending ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
            Eliminar
          </button>
        )}
      </div>

      <div className="grid-2">
        <section className="card stack" aria-label="Documento">
          <h2>Documento</h2>
          <dl className="data-list">
            <div>
              <dt>Archivo</dt>
              <dd>{factura.documento.nombreOriginal}</dd>
            </div>
            <div>
              <dt>Tipo · tamaño</dt>
              <dd>
                {factura.documento.mimeType} · {formatFileSize(factura.documento.tamanoBytes)}
              </dd>
            </div>
            <div>
              <dt>Cargado</dt>
              <dd>{new Date(factura.documento.fechaCarga).toLocaleString('es-CO')}</dd>
            </div>
            <div>
              <dt>Última actualización</dt>
              <dd>{new Date(factura.updatedAt).toLocaleString('es-CO')}</dd>
            </div>
          </dl>
        </section>

        <FacturaForm
          factura={factura}
          saving={update.isPending}
          onSubmit={(values) =>
            update.mutate(values, { onSuccess: () => toast.success('Cambios guardados') })
          }
        />
      </div>
    </>
  );
}