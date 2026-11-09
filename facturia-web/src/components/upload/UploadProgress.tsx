interface Props {
    percent: number;
}

export function UploadProgress({ percent }: Props) {
    const uploading = percent < 100;

    return (
        <div className="card">

            <div className="progress-label">
                <span>{uploading ? 'Subiendo archivo…' : 'Extrayendo datos con IA…'}</span>
                {uploading && <span>{percent}%</span>}
            </div>
            <div
                className="progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploading ? percent : undefined}
                aria-label={uploading ? `Subiendo archivo ${percent}%` : 'Extrayendo datos con IA…'}
            >

                <div
                    className={uploading ? 'progress-bar' : 'progress-bar indeterminate'}
                    style={uploading ? { width: `${percent}%` } : undefined}
                />
            </div>
            {!uploading && <p className="muted" style={{ marginTop: 8 }}>Puede tardar hasta un minuto.</p>}
        </div>

    )
}