import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="page-header stack">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección que buscas no existe.</p>
      <Link to="/facturas" className="btn">
        Volver a facturas
      </Link>
    </div>
  );
}