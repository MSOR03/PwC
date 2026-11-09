export const MAX_FILE_SIZE= 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES=['image/jpeg', 'image/png', 'application/pdf']

//returns an error message or null if the file is valid
export function validateFile(file: File): string | null {

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se aceptan PDF, JPEG y PNG';
  }
  if (file.size === 0) {
    return 'El archivo está vacío';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'El archivo es demasiado grande';
  }
  return null;
}

//Returns a human-readable file size string
export function formatFileSize(bytes:number):string {
    return bytes <1024*1024
    ? `${(Math.round(bytes / 1024)).toFixed(2)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}