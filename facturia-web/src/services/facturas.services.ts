import type{Factura,FacturaFilters,FacturaUpdate} from "../models/factura";
import type {Page} from '../models/paginated';
import {httpClient} from "./httpClient";

// Facturas services for handling API requests related to facturas
export const facturasServices={
    async upload(file:File,onProgress?: (progress: number) => void):Promise<Factura > {
        const formData = new FormData();
        formData.append("file", file);
        const {data} =await httpClient.post<Factura>("/facturas/upload", formData, {
            onUploadProgress:(event)=>{
                if(event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));

            },
        }); 
        return data;

    },
    // List facturas with filters
    async list(filters:FacturaFilters):Promise<Page<Factura>> {
        const {data} = await httpClient.get<Page<Factura>>("/facturas", {
            params: filters
        });
        return data;
        
    },

    // Get a factura by ID
    async getById(id: string): Promise<Factura> {
        const {data} = await httpClient.get<Factura>(`/facturas/${id}`);
        return data;


    },
    // Update a factura by ID
    async update(id: string, body: FacturaUpdate): Promise<Factura> {
        const {data} = await httpClient.put<Factura>(`/facturas/${id}`, body);
        return data;
    },
    // Delete a factura by ID
    async remove(id: string): Promise<void> {
        await httpClient.delete(`/facturas/${id}`);
    }
}
