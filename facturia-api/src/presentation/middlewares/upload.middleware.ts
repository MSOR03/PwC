/*
 * Upload middleware for handling file uploads
 * Limits the file size and number of files to be uploaded
 */

import multer from 'multer';
import {MAX_FILE_SIZE_BYTES} from '../../business/domain/file';

export const uploadInvoiceFile =multer({
    storage:multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1
    }
}).single('archivo')