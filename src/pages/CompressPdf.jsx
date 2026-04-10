import { useState } from 'react';
import { Download, Zap, Gauge, Target } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { compressPdf, downloadFile, formatFileSize } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

const compressionLevels = [
  { id: 'low', label: 'Less Compression', description: 'Best quality, larger file', icon: Target, color: 'text-blue-400 border-blue-400/50 bg-blue-400/10' },
  { id: 'medium', label: 'Moderate', description: 'Balanced quality & size', icon: Gauge, color: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10' },
  { id: 'high', label: 'High Compression', description: 'Smallest file, lower quality', icon: Zap, color: 'text-green-400 border-green-400/50 bg-green-400/10' },
];

export default function CompressPdf() {
  const [files, setFiles] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const handleFilesAdded = (newFiles) => {
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
      setResult(null);
    }
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const originalSize = files[0].size;
      const compressed = await compressPdf(files[0], compressionLevel, setProgress);
      const compressedSize = compressed.length;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      setResult({ original: originalSize, compressed: compressedSize, savings, data: compressed });
      toast({ title: 'Success!', description: `Reduced by ${savings}%` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to compress PDF', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadFile(result.data, files[0].name.replace('.pdf', '_compressed.pdf'));
    }
  };

  return (
    <ToolLayout title="Compress PDF" description="Reduce PDF file size while maintaining quality">
      <div className="max-w-3xl mx-auto space-y-6">
        <FileDropzone files={files} onFilesAdded={handleFilesAdded} onRemoveFile={() => { setFiles([]); setResult(null); }} multiple={false} />
        
        {files.length > 0 && !result && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Select compression level:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {compressionLevels.map((level) => {
                const Icon = level.icon;
                const isSelected = compressionLevel === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setCompressionLevel(level.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected 
                        ? level.color + ' border-current' 
                        : 'border-border bg-secondary/30 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${isSelected ? '' : 'text-foreground'}`}>{level.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {result && (
          <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-sm text-muted-foreground">Original</p><p className="text-lg font-bold text-foreground">{formatFileSize(result.original)}</p></div>
              <div><p className="text-sm text-muted-foreground">Compressed</p><p className="text-lg font-bold text-green-400">{formatFileSize(result.compressed)}</p></div>
              <div><p className="text-sm text-muted-foreground">Saved</p><p className="text-lg font-bold text-green-400">{result.savings}%</p></div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          {files.length > 0 && !result && (
            <Button onClick={handleCompress} size="lg" variant="glow">Compress PDF</Button>
          )}
          {result && (
            <Button onClick={handleDownload} size="lg" variant="glow">
              <Download className="w-5 h-5 mr-2" />
              Download Compressed
            </Button>
          )}
        </div>
      </div>
      <ProcessingOverlay isOpen={processing} message={progress?.message || 'Compressing...'} progress={progress} />
    </ToolLayout>
  );
}
