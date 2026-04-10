import { Loader2 } from 'lucide-react';

export default function ProcessingOverlay({ isOpen, message = 'Processing...', progress }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">{message}</p>
        {progress && (
          <div className="space-y-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{progress.current} / {progress.total}</p>
          </div>
        )}
      </div>
    </div>
  );
}
