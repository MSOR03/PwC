import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastContext, type ToastApi, type ToastType } from "./toast-context";



interface Toast {
    id: string,
    type: ToastType,
    message: string
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Dismiss a toast by its ID (useCallback is used to memoize the function)
    const dismiss = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    // Show a new toast (useCallback is used to memoize the function)
    const show = useCallback(
        (type: ToastType, message: string) => {
            const id = `toast-${++nextId}`;
            setToasts((current) => [...current, { id, type, message }]);
            window.setTimeout(() => dismiss(id), 5000);
        },
        [dismiss],
    );


    /*maping the show function to the ToastApi methods
    and useMemo store the mapped API to prevent unnecessary re-renders
    */
    const api = useMemo<ToastApi>(
        () => ({
            success: (message) => show('success', message),
            error: (message) => show('error', message),
            info: (message) => show('info', message),
        }),
        [show],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toasts" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                        <button type="button" aria-label="Cerrar" onClick={() => dismiss(toast.id)}>
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}