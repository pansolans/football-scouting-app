import React from 'react';
import { VideoContent } from '../types';

interface Props {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
  readOnly?: boolean;
  isSelected?: boolean;
}

// Asegura que el link tenga protocolo (para que el hipervinculo funcione en el PDF)
const normalizeUrl = (url: string): string => {
  const u = (url || '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

// Evita que una URL termine usada como texto del boton
const looksLikeUrl = (s: string) => /https?:\/\/|www\.|\.com|\.be\b|drive\.google/i.test(s);

const VideoBlock: React.FC<Props> = ({ content, onChange, readOnly, isSelected }) => {
  const hasUrl = !!(content.url && content.url.trim());
  const rawLabel = (content.caption || '').trim();
  const label = rawLabel && !looksLikeUrl(rawLabel) ? rawLabel : 'Play video';
  const href = hasUrl ? normalizeUrl(content.url) : undefined;

  // Botón visual (en el editor NO navega: el click sirve para seleccionar/mover el bloque).
  const buttonVisual = (
    <div
      className={`flex items-center justify-center gap-2 w-full h-full min-h-[32px] rounded-lg px-4 py-2 font-semibold text-sm box-border ${
        hasUrl
          ? 'bg-accent/15 text-accent border border-accent/40'
          : 'bg-white/5 text-text-muted border border-dashed border-border-strong'
      }`}
    >
      <span aria-hidden>▶</span>
      <span className="truncate">{hasUrl ? label : 'Pegá un link'}</span>
    </div>
  );

  // Vista de solo lectura (preview): botón navegable
  if (readOnly) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => { if (!hasUrl) e.preventDefault(); }}
        style={{ textDecoration: 'none' }}
        className="block w-full h-full"
      >
        {buttonVisual}
      </a>
    );
  }

  // Editor, bloque NO seleccionado: solo el botón limpio (sin la URL a la vista)
  if (!isSelected) {
    return buttonVisual;
  }

  // Editor, bloque seleccionado: botón + campos para editar el link y el texto
  return (
    <div className="space-y-1.5">
      {buttonVisual}
      <input
        type="text"
        value={content.url}
        onChange={e => onChange({ ...content, url: e.target.value })}
        onPointerDown={e => e.stopPropagation()}
        placeholder="Pegá el link (YouTube, Drive, Veo...)"
        className="w-full bg-transparent border border-border-strong rounded-md p-1.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-accent/50"
      />
      <input
        type="text"
        value={content.caption || ''}
        onChange={e => onChange({ ...content, caption: e.target.value })}
        onPointerDown={e => e.stopPropagation()}
        placeholder="Texto del botón (opcional, ej: Ver jugada)"
        className="w-full bg-transparent border border-border-strong rounded-md p-1.5 text-[11px] text-text-secondary placeholder:text-text-muted outline-none focus:border-accent/50"
      />
      {hasUrl && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-block text-[11px] text-accent hover:underline"
        >
          ↗ Probar link
        </a>
      )}
    </div>
  );
};

export default VideoBlock;
