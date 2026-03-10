import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReportBlock, BLOCK_LABELS } from './types';

interface Props {
  block: ReportBlock;
  onDelete: () => void;
  onDuplicate: () => void;
  children: React.ReactNode;
}

const BlockWrapper: React.FC<Props> = ({ block, onDelete, onDuplicate, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group relative card-elevated rounded-xl p-4 transition-all ${isDragging ? 'ring-2 ring-accent/50' : 'hover:border-accent/20'}`}>
      <div className="flex items-center justify-between mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/8 text-text-muted border-none bg-transparent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium">{BLOCK_LABELS[block.type]}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onDuplicate} className="p-1 rounded hover:bg-white/8 text-text-muted hover:text-text border-none bg-transparent cursor-pointer text-xs" title="Duplicar">⧉</button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-danger/15 text-text-muted hover:text-danger border-none bg-transparent cursor-pointer text-xs" title="Eliminar">✕</button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default BlockWrapper;
