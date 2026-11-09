import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout';
import { CargarFacturaPage } from '../pages/CargarFacturaPage';
import { FacturaDetallePage } from '../pages/FacturaDetallePage';
import { FacturasListPage } from '../pages/FacturasListPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ResumenPage } from '../pages/ResumenPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/facturas" replace /> },
      { path: 'facturas', element: <FacturasListPage /> },
      { path: 'facturas/nueva', element: <CargarFacturaPage /> },
      { path: 'facturas/:id', element: <FacturaDetallePage /> },
      { path: 'reportes', element: <ResumenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);