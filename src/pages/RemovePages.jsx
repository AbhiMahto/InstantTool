import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import PageThumbnail from '@/components/PageThumbnail';
import { Button } from '@/components/ui/button';
import { getPageThumbnails, getPdfInfo, downloadFile } from '@/lib/pdf-utils';
import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer } from '@/lib/pdf-utils';
import { toast } from '@/hooks/use-toast';

export default function RemovePages() {
  const [files, setFiles] = useState([]);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pages, setPages] = useState([]);
  const [removedPages, setRemovedPages] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesAdded = async (newFiles) => {
    if (newFiles.length > 0) {
      const file = newFiles[0];
      setFiles([file]);
      setLoadingThumbnails(true);
      setThumbnails([]);
      setRemovedPages(new Set());

      try {
        const info = await getPdfInfo(file);
        setPdfInfo(info);

        // Initialize pages array
        const initialPages = Array.from({ length: info.pageCount }, (_, i) => ({
          id: `page-${i + 1}`,
          originalIndex: i + 1,
        }));
        setPages(initialPages);

        // Generate thumbnails
        const thumbs = await getPageThumbnails(file, 0.5);
        setThumbnails(thumbs);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({ title: 'Error', description: 'Failed to load PDF', variant: 'destructive' });
      } finally {
        setLoadingThumbnails(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setPdfInfo(null);
    setThumbnails([]);
    setPages([]);
    setRemovedPages(new Set());
  };

  const togglePage = (pageNumber) => {
    setRemovedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleProcess = async () => {
    if (!pdfInfo || pages.length === 0) return;

    const keptPages = pages.filter((p) => !removedPages.has(p.originalIndex));
    if (keptPages.length === 0) {
      toast({ title: 'Error', description: 'You must keep at least one page', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const arrayBuffer = await readFileAsArrayBuffer(files[0]);
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Copy pages in the new order, excluding removed ones
      const pageIndices = keptPages.map((p) => p.originalIndex - 1);
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const result = await newPdf.save();
      downloadFile(result, files[0].name.replace('.pdf', '_edited.pdf'));
      toast({
        title: 'Success!',
        description: `Created PDF with ${keptPages.length} pages (removed ${removedPages.size})`,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({ title: 'Error', description: 'Failed to process PDF', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const keptCount = pages.length - removedPages.size;

  return (
    <ToolLayout
      title="Remove Pages"
      description="Preview pages, remove unwanted ones, and drag to reorder"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <FileDropzone
          files={files}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={handleRemoveFile}
          multiple={false}
        />

        {loadingThumbnails && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading page previews...</p>
          </div>
        )}

        {pdfInfo && thumbnails.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Drag pages to reorder. Click remove/keep to toggle.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400">Keeping: {keptCount}</span>
                <span className="text-destructive">Removing: {removedPages.size}</span>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {pages.map((page) => (
                    <PageThumbnail
                      key={page.id}
                      id={page.id}
                      pageNumber={page.originalIndex}
                      thumbnail={thumbnails[page.originalIndex - 1]}
                      isRemoved={removedPages.has(page.originalIndex)}
                      onToggle={togglePage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleProcess}
                size="lg"
                variant="glow"
                disabled={keptCount === 0}
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF ({keptCount} pages)
              </Button>
            </div>
          </>
        )}
      </div>
      <ProcessingOverlay isOpen={processing} message="Processing PDF..." />
    </ToolLayout>
  );
}