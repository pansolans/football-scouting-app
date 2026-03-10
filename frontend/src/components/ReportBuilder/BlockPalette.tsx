import React from 'react';
import { BlockType, BLOCK_LABELS } from './types';

interface Props {
  onAdd: (type: BlockType) => void;
}

const ICONS: Record<BlockType, string> = {
  header: 'H',
  text: 'T',
  image: '🖼',
  video: '▶',
  stats_table: '📊',
  divider: '—',
  shape: '■',
  banner: '▬',
};

const BlockPalette: React.FC<Props> = ({ onAdd }) => {
  const types: BlockType[] = ['header', 'text', 'image', 'video', 'stats_table', 'divider', 'shape', 'banner'];

  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-widest text-text-muted font-medium mb-3">Agregar Bloque</h4>
      {types.map(type => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-border-strong hover:border-accent/30 transition-all cursor-pointer text-left group"
        >
          <span className="w-8 h-8 rounded-md bg-accent/10 text-accent flex items-center justify-center text-sm font-bold group-hover:bg-accent/20 transition-colors">
            {ICONS[type]}
          </span>
          <span className="text-sm text-text-secondary group-hover:text-text transition-colors">
            {BLOCK_LABELS[type]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BlockPalette;
