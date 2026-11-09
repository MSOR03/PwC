import {useState} from 'react'

interface Props{
    onFileSelected: (file: File) => void;
    disabled?: boolean;
}

export function FileDropZone({onFileSelected, disabled=false}: Props) {
    const [dragging, setDragging] = useState(false)
    
    const handleFiles = (files: FileList | null) => {
        const file = files?.[0]
        if (file) {
            onFileSelected(file)
        }
    }

    const className =['dropzone',dragging && 'dragging', disabled && 'disabled'].
    filter(Boolean)
    .join(' ')

    return (
         <label
      className={className}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
    >
      <span className="dropzone-title">
        Arrastra la factura aquí o <u>selecciona un archivo</u>
      </span>
      <span className="muted">PDF, PNG o JPG · máximo 10 MB</span>
      <input
        type="file"
        className="visually-hidden"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = ''; // allows selecting the same file again
        }}
      />
    </label>
  );
}