import {createContext} from "react";

export type ToastType = "success" | "error" | "info";

export type ToastApi = {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
};


// Context for managing toast notifications
export const ToastContext = createContext<ToastApi | null>(null);