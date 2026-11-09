import {useMutation,useQueryClient} from '@tanstack/react-query'
import {useState} from 'react'
import {facturasServices} from '../services/facturas.services'

export function useUploadFactura() {
    //Using cache to keep the list of invoices up-to-date
    const queryClient = useQueryClient()
    //Follow the upload progress with the progress state
    const [progress, setProgress] = useState(0)

    //React query mutation for server actions related to uploading invoices
    const mutation =useMutation({
        mutationFn:(file: File) => {
           setProgress(0);
           return facturasServices.upload(file,setProgress)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['resumen'] });
        }

    })

    return { ...mutation, progress }
}