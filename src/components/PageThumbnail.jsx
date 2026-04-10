import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Minus, Trash2 } from 'lucide-react';

export default function PageThumbnail({ id, pageNumber, thumbnail, isRemoved, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isDragging ? 'shadow-2xl scale-105' : ''
      } ${
        isRemoved
          ? 'border-destructive/50 bg-destructive/10 opacity-60'
          : 'border-border hover:border-primary bg-card'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Page Number Badge */}
      <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium">
        Page {pageNumber}
      </div>

      {/* Thumbnail Image */}
      <div className="aspect-[3/4] relative overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${pageNumber}`}
            className={`w-full h-full object-contain bg-white ${isRemoved ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        )}

        {/* Removed Overlay */}
        {isRemoved && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
            <Trash2 className="w-8 h-8 text-destructive" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => onToggle(pageNumber)}
        className={`w-full py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
          isRemoved
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : 'bg-destructive/20 text-destructive hover:bg-destructive/30'
        }`}
      >
        {isRemoved ? (
          <>
            <Plus className="w-4 h-4" />
            <span>Keep Page</span>
          </>
        ) : (
          <>
            <Minus className="w-4 h-4" />
            <span>Remove</span>
          </>
        )}
      </button>
    </div>
  );
}