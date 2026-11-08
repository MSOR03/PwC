export type ErrorCode=
|'VALIDATION'
|'NOT_FOUND'
|'DUPLICATE_INVOICE'
|'PAYLOAD_TOO_LARGE'
|'UNSUPPORTED_MEDIA_TYPE'
|'EXTRACTION_FAILED'
|'LLM_PROVIDER' // Set of permitted app errors 

// Base class for all application-specific errors
export abstract class AppError extends Error {
    abstract readonly code: ErrorCode;


constructor(
    message: string,
    public readonly details?: unknown,
) {
    super(message);
    this.name = new.target.name;
}

}
//For each specific error, we create a class extending AppError with a unique code.
export class ValidationError extends AppError {
    readonly code = 'VALIDATION';
}

export class NotFoundError extends AppError {
    readonly code = 'NOT_FOUND';
}


export class DuplicateInvoiceError extends AppError {
    readonly code = 'DUPLICATE_INVOICE';
}

export class PayloadTooLargeError extends AppError {
    readonly code = 'PAYLOAD_TOO_LARGE';
}

export class UnsupportedMediaTypeError extends AppError {
    readonly code = 'UNSUPPORTED_MEDIA_TYPE';
}

export class ExtractionError extends AppError {
    readonly code = 'EXTRACTION_FAILED';
}

export class LlmProviderError extends AppError {
    readonly code = 'LLM_PROVIDER';
}

