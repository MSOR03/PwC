interface Props {
    url: string | null;
    mimeType?: string;
}

export function FilePreview({ url, mimeType }: Props) {
    if (!url) {
        return <div className="preview-empty-muted">La vista aparecera aqui </div>
    }
    if (mimeType === 'application/pdf') {
        // Hide the viewer toolbar and side panel, and fit the whole page in the frame
        const pdfUrl = `${url}#toolbar=0&navpanes=0&view=Fit&zoom=page-fit`;
        return (
            <object data={pdfUrl} type="application/pdf" className="preview-frame" aria-label="Vista previa del PDF">
                <p className="muted">Tu navegador no puede mostrar el PDF.</p>
            </object>
        );
    }
    return <img className="preview-image" src={url} alt="Vista previa no disponible para este tipo de archivo" />;
}