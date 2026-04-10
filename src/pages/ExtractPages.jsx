import { useState, useEffect, useCallback } from 'react';
import { Download, GripVertical, X, Check, Loader2 } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { Button } from '@/components/ui/button';
import { extractPages, downloadFile, getPdfInfo, getPageThumbnails } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function ExtractPages() {
  const [files, setFiles] = useState([]);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleFilesAdded = async (newFiles) => {
    if (newFiles.length > 0) {
      setFiles([newFiles[0]]);
      const info = await getPdfInfo(newFiles[0]);
      setPdfInfo(info);
      setSelectedPages([]);
      setPages([]);
      
      // Generate thumbnails
      setLoadingThumbnails(true);
      try {
        const thumbnails = await getPageThumbnails(newFiles[0]);
        const pageData = thumbnails.map((thumb, i) => ({
          id: i + 1,
          number: i + 1,
          thumbnail: thumb,
          selected: true,
        }));
        setPages(pageData);
        setSelectedPages(pageData.map(p => p.number));
      } catch (error) {
        console.error('Failed to generate thumbnails:', error);
        // Fallback without thumbnails
        const pageData = Array.from({ length: info.pageCount }, (_, i) => ({
          id: i + 1,
          number: i + 1,
          thumbnail: null,
          selected: true,
        }));
        setPages(pageData);
        setSelectedPages(pageData.map(p => p.number));
      }
      setLoadingThumbnails(false);
    }
  };

  const togglePage = (pageNumber) => {
    setSelectedPages(prev => 
      prev.includes(pageNumber) 
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber]
    );
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPages = [...pages];
    const draggedPage = newPages[draggedIndex];
    newPages.splice(draggedIndex, 1);
    newPages.splice(index, 0, draggedPage);
    setPages(newPages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleExtract = async () => {
    if (!pdfInfo || selectedPages.length === 0) return;
    setProcessing(true);
    try {
      // Get pages in the current order that are selected
      const orderedSelectedPages = pages
        .filter(p => selectedPages.includes(p.number))
        .map(p => p.number);
      
      const result = await extractPages(files[0], orderedSelectedPages);
      downloadFile(result, files[0].name.replace('.pdf', '_extracted.pdf'));
      toast({ title: 'Success!', description: `Extracted ${orderedSelectedPages.length} pages` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to extract pages', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const selectAll = () => setSelectedPages(pages.map(p => p.number));
  const deselectAll = () => setSelectedPages([]);

  return (
    <ToolLayout title="Extract Pages" description="Select, reorder, and extract pages from your PDF">
      <div className="max-w-5xl mx-auto space-y-6">
        <FileDropzone 
          files={files} 
          onFilesAdded={handleFilesAdded} 
          onRemoveFile={() => { setFiles([]); setPdfInfo(null); setPages([]); setSelectedPages([]); }} 
          multiple={false} 
        />
        
        {loadingThumbnails && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading page previews...</span>
          </div>
        )}
        
        {pages.length > 0 && !loadingThumbnails && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedPages.length} of {pages.length} pages selected • Drag to reorder • Click to toggle
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {pages.map((page, index) => {
                const isSelected = selectedPages.includes(page.number);
                return (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => togglePage(page.number)}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      isSelected 
                        ? 'border-primary shadow-lg shadow-primary/20' 
                        : 'border-destructive/50 opacity-60 hover:opacity-80'
                    } ${draggedIndex === index ? 'scale-105 shadow-xl z-10' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    {/* Selection Indicator */}
                    <div className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
                      isSelected ? 'bg-primary' : 'bg-destructive'
                    }`}>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <X className="w-4 h-4 text-destructive-foreground" />
                      )}
                    </div>
                    
                    {/* Page Preview */}
                    <div className="bg-white flex items-center justify-center min-h-[200px]">
                      {page.thumbnail ? (
                        <img 
                          src={page.thumbnail} 
                          alt={`Page ${page.number}`} 
                          className="w-full h-auto object-contain"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-3xl font-bold text-muted-foreground">{page.number}</span>
                      )}
                    </div>
                    
                    {/* Page Number Label */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-background/0 py-3 text-center">
                      <span className="text-sm font-semibold text-foreground px-3 py-1 rounded-full bg-secondary/80">
                        Page {page.number}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        {selectedPages.length > 0 && (
          <div className="flex justify-center">
            <Button onClick={handleExtract} size="lg" variant="glow">
              <Download className="w-5 h-5 mr-2" />
              Extract {selectedPages.length} Pages
            </Button>
          </div>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message="Extracting pages..." />
    </ToolLayout>
  );
}
