export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?:{field: string; message: string}[]
}

//single error type from everything comes from API

export class ApiError extends Error {
    readonly status:number;
    readonly problem?: ProblemDetails;

    constructor(status: number,message:string, problem?: ProblemDetails) {
        super(message);
        this.name='ApiError';
        this.status = status;
        this.problem = problem;
    }
}