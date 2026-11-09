import { ApiError } from "../models/problemDetails";

const MESSAGES: Record<number, string> = {
    400: 'Revisa los datos enviados.',
    404: 'No encontramos lo que buscas. Puede que haya sido eliminado.',
    409: 'Esta factura ya fue registrada.',
    413: 'El archivo supera el máximo de 10 MB.',
    415: 'Solo se aceptan archivos PDF, PNG o JPG.',
    422: 'No pudimos leer los datos de la factura. Verifica que el archivo sea legible.',
    502: 'El servicio de IA no respondió. Intenta de nuevo en unos minutos.',
    500: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

//returns message status or as default 500 
export function messageForStatus(status: number): string {
    return MESSAGES[status] ?? MESSAGES[500];
}

//returns the error message from an apierror or by default 500
export function getErrorMessage(error: ApiError): string {
    return error instanceof ApiError ? error.message : MESSAGES[500];

}