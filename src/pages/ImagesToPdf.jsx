import { useState } from 'react';
import { Download } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { imagesToPdf, downloadFile } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function ImagesToPdf() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleFilesAdded = (newFiles) => {
    setFiles([...files, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const result = await imagesToPdf(files, setProgress);
      downloadFile(result, 'images.pdf');
      toast({ title: 'Success!', description: `Created PDF from ${files.length} images` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create PDF', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <ToolLayout title="Images to PDF" description="Create a PDF from multiple images">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={handleRemoveFile}
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] }}
        />
        
        {files.length > 0 && (
          <div className="flex justify-center">
            <Button onClick={handleConvert} size="lg" variant="glow">
              <Download className="w-5 h-5 mr-2" />
              Create PDF from {files.length} Images
            </Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message={progress?.message || 'Creating PDF...'} progress={progress} />
    </ToolLayout>
  );
}
