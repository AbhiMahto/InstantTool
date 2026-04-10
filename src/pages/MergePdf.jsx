import { useState } from 'react';
import { Download, GripVertical } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { mergePdfs, downloadFile, getPdfInfo } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function MergePdf() {
  const [files, setFiles] = useState([]);
  const [pdfInfos, setPdfInfos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleFilesAdded = async (newFiles) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    const infos = await Promise.all(newFiles.map(getPdfInfo));
    setPdfInfos([...pdfInfos, ...infos]);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPdfInfos(pdfInfos.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ title: 'Need more files', description: 'Please add at least 2 PDFs to merge', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    try {
      const result = await mergePdfs(files, setProgress);
      downloadFile(result, 'merged.pdf');
      toast({ title: 'Success!', description: 'PDFs merged successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to merge PDFs', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <ToolLayout title="Merge PDF" description="Combine multiple PDF files into a single document">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone files={files} onFilesAdded={handleFilesAdded} onRemoveFile={handleRemoveFile} />
        
        {files.length >= 2 && (
          <div className="flex justify-center">
            <Button onClick={handleMerge} size="lg" variant="glow">
              <Download className="w-5 h-5 mr-2" />
              Merge {files.length} PDFs
            </Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message={progress?.message || 'Merging PDFs...'} progress={progress} />
    </ToolLayout>
  );
}
