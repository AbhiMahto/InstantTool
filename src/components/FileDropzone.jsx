import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/pdf-utils';

export default function FileDropzone({ onFilesAdded, files = [], onRemoveFile, accept = { 'application/pdf': ['.pdf'] }, multiple = true, maxFiles = 50 }) {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive ? "drop-zone-active border-primary" : "border-border hover:border-primary/50 hover:bg-secondary/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn("w-12 h-12 mx-auto mb-4 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
        <p className="text-lg font-medium text-foreground mb-2">
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted-foreground">or click to browse</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <File className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              {onRemoveFile && (
                <button onClick={() => onRemoveFile(index)} className="p-1 hover:bg-destructive/20 rounded transition-colors">
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
