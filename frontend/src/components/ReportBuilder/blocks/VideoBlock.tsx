import React from 'react';
import { VideoContent } from '../types';

interface Props {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
  readOnly?: boolean;
}

// Asegura que el link tenga protocolo (para que el hipervinculo funcione en el PDF)
const normalizeUrl = (url: string): string => {
  const u = (url || '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

const VideoBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const hasUrl = !!(content.url && content.url.trim());
  const label = (content.caption && content.caption.trim()) || 'Ver video';
  const href = hasUrl ? normalizeUrl(content.url) : undefined;

  const button = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => { e.stopPropagation(); if (!hasUrl) e.preventDefault(); }}
      style={{ textDecoration: 'none' }}
      className={`flex items-center justify-center gap-2 w-full h-full min-h-[36px] rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors box-border ${
        hasUrl
          ? 'bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 cursor-pointer'
          : 'bg-white/5 text-text-muted border border-border-strong cursor-default'
      }`}
      title={hasUrl ? href : 'Sin link cargado'}
    >
      <span aria-hidden>▶</span>
      <span className="truncate">{label}</span>
    </a>
  );

  if (readOnly) return button;

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={content.url}
        onChange={e => onChange({ ...content, url: e.target.value })}
        placeholder="Pega el link del video (YouTube, Veo, Drive, etc.)"
        className="w-full bg-transparent border border-border-strong rounded-md p-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent/50"
      />
      <input
        type="text"
        value={content.caption || ''}
        onChange={e => onChange({ ...content, caption: e.target.value })}
        placeholder="Texto del boton (ej: Ver jugada) — opcional"
        className="w-full bg-transparent border border-border-strong rounded-md p-2 text-xs text-text-secondary placeholder:text-text-muted outline-none focus:border-accent/50"
      />
      {button}
    </div>
  );
};

export default VideoBlock;
