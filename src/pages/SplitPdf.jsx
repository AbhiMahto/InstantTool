import { useState } from 'react';
import { Download } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { splitPdfToPages, downloadAsZip, getPdfInfo } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function SplitPdf() {
  const [files, setFiles] = useState([]);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleFilesAdded = async (newFiles) => {
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
      const info = await getPdfInfo(newFiles[0]);
      setPdfInfo(info);
    }
  };

  const handleSplit = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const results = await splitPdfToPages(files[0], setProgress);
      await downloadAsZip(results, 'split-pages.zip', setProgress);
      toast({ title: 'Success!', description: 'PDF split into individual pages' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to split PDF', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <ToolLayout title="Split PDF" description="Separate one PDF into multiple files">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone files={files} onFilesAdded={handleFilesAdded} onRemoveFile={() => { setFiles([]); setPdfInfo(null); }} multiple={false} />
        
        {pdfInfo && (
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">Pages: <span className="text-foreground font-medium">{pdfInfo.pageCount}</span></p>
          </div>
        )}
        
        {files.length > 0 && (
          <div className="flex justify-center">
            <Button onClick={handleSplit} size="lg" variant="glow">
              <Download className="w-5 h-5 mr-2" />
              Split into Pages
            </Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message={progress?.message || 'Splitting PDF...'} progress={progress} />
    </ToolLayout>
  );
}
