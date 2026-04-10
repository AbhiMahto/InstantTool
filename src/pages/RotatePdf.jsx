import { useState } from 'react';
import { Download, RotateCw } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { rotatePdf, downloadFile, getPdfInfo } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function RotatePdf() {
  const [files, setFiles] = useState([]);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);

  const handleFilesAdded = async (newFiles) => {
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
      const info = await getPdfInfo(newFiles[0]);
      setPdfInfo(info);
    }
  };

  const handleRotate = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    try {
      const rotations = Array.from({ length: pdfInfo.pageCount }, (_, i) => ({ pageIndex: i, degrees: rotation }));
      const result = await rotatePdf(files[0], rotations);
      downloadFile(result, files[0].name.replace('.pdf', '_rotated.pdf'));
      toast({ title: 'Success!', description: 'PDF rotated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to rotate PDF', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout title="Rotate PDF" description="Rotate all pages in your PDF">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone files={files} onFilesAdded={handleFilesAdded} onRemoveFile={() => { setFiles([]); setPdfInfo(null); }} multiple={false} />
        {pdfInfo && (
          <div className="flex gap-2 justify-center">
            {[90, 180, 270].map((deg) => (
              <Button key={deg} variant={rotation === deg ? 'default' : 'outline'} onClick={() => setRotation(deg)}>
                <RotateCw className="w-4 h-4 mr-2" />{deg}°
              </Button>
            ))}
          </div>
        )}
        {files.length > 0 && (
          <div className="flex justify-center">
            <Button onClick={handleRotate} size="lg" variant="glow"><Download className="w-5 h-5 mr-2" />Rotate & Download</Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message="Rotating PDF..." />
    </ToolLayout>
  );
}
