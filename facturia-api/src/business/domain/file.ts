import { PayloadTooLargeError, UnsupportedMediaTypeError, ValidationError } from './errors';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [ 'application/pdf', 'image/png','image/jpeg'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

//First bytes('magic bytes') of each allowed file type
const SIGNATURES:{mimeType: AllowedMimeType, bytes:number[]}[] = [  
    { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // PDF
    { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
    { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] } // JPEG   

];

export interface FileInput{
    content:Uint8Array;
    originalName: string;
    sizeBytes: number;

}

export  function detectMimeType(content: Uint8Array): AllowedMimeType | null {
    const signature = SIGNATURES.find(({bytes}) => content.length >= bytes.length && bytes.every((byte,i) => content[i] === byte));
    
    return signature ? signature.mimeType : null;
}   

//Validates size and real type of the file

export function validateFile(file: FileInput): AllowedMimeType{

    if (file.sizeBytes ===0){
        throw new ValidationError('File is empty');
    }

    if (file.sizeBytes > MAX_FILE_SIZE_BYTES) {
        throw new PayloadTooLargeError(`File exceeds maximum size of ${MAX_FILE_SIZE_BYTES} bytes`);
    }

    const mimeType = detectMimeType(file.content);
    if (!mimeType) {
        throw new UnsupportedMediaTypeError('File type is not supported');
    }

    return mimeType;
}