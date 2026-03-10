import React from 'react';
import { VideoContent } from '../types';

interface Props {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
  readOnly?: boolean;
}

const getEmbedUrl = (url: string): string | null => {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
};

const VideoBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const embedUrl = content.url ? getEmbedUrl(content.url) : null;

  return (
    <div className="space-y-3">
      {!readOnly && (
        <input
          type="text"
          value={content.url}
          onChange={e => onChange({ ...content, url: e.target.value })}
          placeholder="URL del video (YouTube, Vimeo)..."
          className="w-full bg-transparent border border-border-strong rounded-md p-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent/50"
        />
      )}

      {embedUrl ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-border-strong" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          />
        </div>
      ) : content.url && (
        <div className="p-4 bg-white/5 rounded-lg text-center">
          <p className="text-text-muted text-sm">URL no reconocida. Soporta YouTube y Vimeo.</p>
          <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline">
            Abrir link
          </a>
        </div>
      )}

      {!readOnly && (
        <input
          type="text"
          value={content.caption || ''}
          onChange={e => onChange({ ...content, caption: e.target.value })}
          placeholder="Descripcion del video (opcional)"
          className="w-full bg-transparent border border-border-strong rounded-md p-2 text-xs text-text-secondary placeholder:text-text-muted outline-none focus:border-accent/50"
        />
      )}
      {readOnly && content.caption && (
        <p className="text-xs text-text-muted text-center">{content.caption}</p>
      )}
    </div>
  );
};

export default VideoBlock;
