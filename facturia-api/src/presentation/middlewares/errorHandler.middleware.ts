import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import {
    AppError,
    PayloadTooLargeError,
    ValidationError,
    type ErrorCode
} from "../../business/domain/errors";

const PROBLEM_BASE_URL = 'https://api.facturia.local/errors';

//dictionary mapping error codes to problem details
const problems: Record<ErrorCode, { status: number; slug: string; title: string }> = {
    'VALIDATION': {
        status: 400,
        slug: 'validation-error',
        title: 'Validation Error',

    },
    'NOT_FOUND': {
        status: 404,
        slug: 'not-found',
        title: 'Resource Not Found'
    },
    'DUPLICATE_INVOICE': {
        status: 409,
        slug: 'duplicate-invoice',
        title: 'Duplicate Invoice'
    },
    'PAYLOAD_TOO_LARGE': {
        status: 413,
        slug: 'payload-too-large',
        title: 'Payload Too Large'
    },
    'UNSUPPORTED_MEDIA_TYPE': {
        status: 415,
        slug: 'unsupported-media-type',
        title: 'Unsupported Media Type'
    },
    'EXTRACTION_FAILED': {
        status: 422,
        slug: 'extraction-failed',
        title: 'Extraction Failed'
    },
    'LLM_PROVIDER': {
        status: 502,
        slug: 'llm-provider',
        title: 'LLM Provider Error'
    }
};

//convert unknown errors to AppError instances if possible
function toAppError(err: unknown): AppError | undefined {

    // the error is already an AppError instance
    if (err instanceof AppError) return err;

    // handle Zod validation errors
    if (err instanceof ZodError) {
        return new ValidationError(
            'Invalid request data',
            err.issues.map((issue)=>({
                field: issue.path.join('.'),
                message: issue.message
            }))
        );
    }

    // handle Multer errors for file uploads
    if (err instanceof multer.MulterError) {
        return err.code==='LIMIT_FILE_SIZE'
        ?new PayloadTooLargeError('File size exceeds the 10MB limit')
        :new ValidationError(err.message);
    }
    
    // handle invalid JSON body errors
    if (err instanceof SyntaxError && 'status' in err && err.status===400) {
        return new ValidationError('Invalid JSON body');
    }

    return undefined;

}

// Handling error that couldn't be converted to an AppError instance
export const errorHandler: ErrorRequestHandler = (err, req, res,_next) => {
    const appError = toAppError(err);

    if (!appError) {
        console.error(err);
        res.status(500).type('application/problem+json').json({
            type: `${PROBLEM_BASE_URL}#internal-server-error`,
            title: 'Internal Server Error',
            status: 500,
            detail: 'An unexpected error occurred',
            instance:req.originalUrl
        });
        return;
    } 
    
    const problem = problems[appError.code];
    res.status(problem.status).type('application/problem+json').json({
        type: `${PROBLEM_BASE_URL}#${problem.slug}`,
        title: problem.title,
        status: problem.status,
        detail: appError.message,
        instance: req.originalUrl,
        ...(appError.details !== undefined ? { errors: appError.details } : {})
    });
}