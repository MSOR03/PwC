import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '../components/ui/ToastProvider';
import { useToast } from '../components/ui/useToast';
import { ApiError } from '../models/problemDetails';
import { getErrorMessage } from '../utils/errorMessages'

// Provides the QueryClient and handles global query and mutation errors with toast notifications.
function QueryProvider({children}: {children: ReactNode}) {
    const toast = useToast();
    const [queryClient] = useState(() => new QueryClient({
        // Configure the query cache to show toast notifications on errors.
        queryCache: new QueryCache({
            onError: (error) => {
                toast.error(getErrorMessage(error as ApiError));
            }
        }),

        // Configure the mutation cache to show toast notifications on errors.
        mutationCache: new MutationCache({
            onError: (error) => {
                toast.error(getErrorMessage(error as ApiError));
            }
        }),


        // Configure default query options.
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,

                retry: (failureCount, error) => {
                     return failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500);
                }
            },
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export function AppProviders({children}: {children: ReactNode}) {
    return (
        <ToastProvider>
            <QueryProvider>
                {children}
            </QueryProvider>
        </ToastProvider>
    );
}
