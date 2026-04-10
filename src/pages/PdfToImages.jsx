import { useState } from 'react';
import { Download } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { pdfToImages, downloadAsZip, getPdfInfo } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function PdfToImages() {
  const [files, setFiles] = useState([]);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [format, setFormat] = useState('png');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleFilesAdded = async (newFiles) => {
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
      const info = await getPdfInfo(newFiles[0]);
      setPdfInfo(info);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const images = await pdfToImages(files[0], format, 1.5, setProgress);
      await downloadAsZip(images, `${files[0].name.replace('.pdf', '')}_images.zip`, setProgress);
      toast({ title: 'Success!', description: `Converted ${images.length} pages to ${format.toUpperCase()}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to convert PDF', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <ToolLayout title="PDF to Images" description="Convert PDF pages to JPG or PNG images">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone files={files} onFilesAdded={handleFilesAdded} onRemoveFile={() => { setFiles([]); setPdfInfo(null); }} multiple={false} />
        
        {pdfInfo && (
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">Pages: <span className="text-foreground font-medium">{pdfInfo.pageCount}</span></p>
            <div className="flex gap-2">
              <Button variant={format === 'png' ? 'default' : 'outline'} size="sm" onClick={() => setFormat('png')}>PNG</Button>
              <Button variant={format === 'jpeg' ? 'default' : 'outline'} size="sm" onClick={() => setFormat('jpeg')}>JPG</Button>
            </div>
          </div>
        )}
        
        {files.length > 0 && (
          <div className="flex justify-center">
            <Button onClick={handleConvert} size="lg" variant="glow">
              <Download className="w-5 h-5 mr-2" />
              Convert to {format.toUpperCase()}
            </Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message={progress?.message || 'Converting...'} progress={progress} />
    </ToolLayout>
  );
}
