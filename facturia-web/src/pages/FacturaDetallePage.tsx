import {useParams } from "react-router";


export function FacturaDetallePage() {
    const { id } = useParams();

    return (
        <div className="page-header">
            <h1>Detalle de Factura</h1>
            <p className="muted">Aquí se muestra la información de la factura con ID: {id}</p>
        </div>
    );
}