import axios, {type AxiosError} from "axios";
import {ApiError,type ProblemDetails } from "../models/problemDetails";

import {messageForStatus} from "../utils/errorMessages";

export const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 90_000, // the LLM can take up to ~60s

});

//Verify if the given data conforms to the ProblemDetails structure
function isProblemDetails(data: unknown): data is ProblemDetails {
    return typeof data === "object" && data !== null && "status" in data && "title" in data && "detail" in data;
}

// Interceptor to handle HTTP response errors and map them to ApiError instances
httpClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response ) {
            const {status,data} = error.response;
            return Promise.reject(
                 new ApiError(status, messageForStatus(status), isProblemDetails(data) ? data : undefined),
            );
        }

        if (error.code=== 'ECONNABORTED') {
            return Promise.reject(new ApiError(0,"La solicitud tardo demasido, intentalo de nuevo"));
        }
        return Promise.reject(new ApiError(0, 'No se pudo conectar con el servidor'));
    }
);

