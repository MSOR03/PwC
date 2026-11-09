import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ExtractionResult } from '../components/upload/ExtractionResult';
import { FileDropZone } from '../components/upload/FileDropzone';
import { FilePreview } from '../components/upload/FilePreview';
import { UploadProgress } from '../components/upload/UploadProgress';
import { useToast } from '../components/ui/useToast';
import { useUploadFactura } from '../hooks/useUploadFactura';
import { formatFileSize, validateFile } from '../utils/file';

interface SelectedFile {
  file: File;
  url: string;
}

export function CargarFacturaPage() {
  const toast = useToast();
  const upload = useUploadFactura();
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);

  // Free the preview URL when leaving the page
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const replacePreview = (file: File | null) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = file ? URL.createObjectURL(file) : null;
    setSelected(file && previewUrl.current ? { file, url: previewUrl.current } : null);
  };

  const handleFileSelected = (file: File) => {
    upload.reset();
    const error = validateFile(file);
    setFileError(error);
    replacePreview(error ? null : file);
  };

  const handleClear = () => {
    upload.reset();
    setFileError(null);
    replacePreview(null);
  };

  const handleSubmit = () => {
    if (!selected) return;
    upload.mutate(selected.file, {
      onSuccess: (factura) => toast.success(`Factura ${factura.numeroFactura} registrada`),
    });
  };

  return (
    <>
      <header className="page-header">
        <h1>Cargar factura</h1>
        <p className="muted">
          Sube un PDF o una imagen y la IA extraerá los datos clave. Podrás revisarlos después.
        </p>
      </header>

      <div className="grid-2">
        <div className="stack">
          {upload.isSuccess ? (
            <ExtractionResult factura={upload.data} onUploadAnother={handleClear} />
          ) : (
            <>
              <FileDropZone onFileSelected={handleFileSelected} disabled={upload.isPending} />

              {fileError && <p className="error-text">{fileError}</p>}

              {selected && (
                <div className="card file-row">
                  <span className="file-badge">
                    {selected.file.type === 'application/pdf' ? 'PDF' : 'IMG'}
                  </span>
                  <div className="file-info">
                    <p className="file-name">{selected.file.name}</p>
                    <p className="muted">{formatFileSize(selected.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleClear}
                    disabled={upload.isPending}
                  >
                    Quitar
                  </button>
                </div>
              )}

              {upload.isPending && <UploadProgress percent={upload.progress} />}

              <div className="actions">
                <Link to="/facturas" className="btn">
                  Cancelar
                </Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={!selected || upload.isPending}
                >
                  {upload.isPending ? 'Procesando…' : 'Extraer datos'}
                </button>
              </div>
            </>
          )}
        </div>

        <section className="card" aria-label="Vista previa">
          <h2>Vista previa</h2>
          <FilePreview url={selected?.url ?? null} mimeType={selected?.file.type} />
        </section>
      </div>
    </>
  );
}