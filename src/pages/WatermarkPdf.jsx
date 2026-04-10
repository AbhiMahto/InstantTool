import { useState } from 'react';
import { Download } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { addWatermark, downloadFile } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function WatermarkPdf() {
  const [files, setFiles] = useState([]);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [processing, setProcessing] = useState(false);

  const handleFilesAdded = (newFiles) => { if (newFiles.length > 0) setFiles([newFiles[0]]); };

  const handleWatermark = async () => {
    if (files.length === 0 || !watermarkText) return;
    setProcessing(true);
    try {
      const result = await addWatermark(files[0], watermarkText);
      downloadFile(result, files[0].name.replace('.pdf', '_watermarked.pdf'));
      toast({ title: 'Success!', description: 'Watermark added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add watermark', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout title="Add Watermark" description="Add text watermark to your PDF">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone files={files} onFilesAdded={handleFilesAdded} onRemoveFile={() => setFiles([])} multiple={false} />
        {files.length > 0 && (
          <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Watermark text" className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground" />
        )}
        {files.length > 0 && watermarkText && (
          <div className="flex justify-center">
            <Button onClick={handleWatermark} size="lg" variant="glow"><Download className="w-5 h-5 mr-2" />Add Watermark</Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message="Adding watermark..." />
    </ToolLayout>
  );
}
