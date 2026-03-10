import React, { useRef } from 'react';
import { ImageContent } from '../types';

interface Props {
  content: ImageContent;
  onChange: (content: ImageContent) => void;
  onImageLoad?: (width: number, height: number) => void;
  readOnly?: boolean;
}

const ImageBlock: React.FC<Props> = ({ content, onChange, onImageLoad, readOnly }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      onChange({ ...content, url });
      // Measure image dimensions
      const img = new Image();
      img.onload = () => onImageLoad?.(img.naturalWidth, img.naturalHeight);
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleUrl = () => {
    const url = prompt('URL de la imagen:');
    if (!url) return;
    onChange({ ...content, url });
    const img = new Image();
    img.onload = () => onImageLoad?.(img.naturalWidth, img.naturalHeight);
    img.src = url;
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    onImageLoad?.(img.naturalWidth, img.naturalHeight);
  };

  if (readOnly && content.url) {
    return (
      <div className="w-full h-full">
        <img src={content.url} alt={content.caption || ''} className="w-full h-full object-cover rounded-lg" onLoad={handleImgLoad} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {content.url ? (
        <div className="relative w-full h-full group">
          <img src={content.url} alt={content.caption || ''} className="w-full h-full object-cover rounded-lg" onLoad={handleImgLoad} />
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-1.5 bg-black/60 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              type="text"
              value={content.caption || ''}
              onChange={e => onChange({ ...content, caption: e.target.value })}
              placeholder="Descripcion..."
              className="flex-1 bg-transparent border-none outline-none text-[10px] text-white/80 placeholder:text-white/40"
            />
            <button
              onClick={() => onChange({ ...content, url: '' })}
              className="px-2 py-0.5 bg-danger/80 text-white text-[9px] rounded cursor-pointer border-none hover:bg-danger"
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full border-2 border-dashed border-border-strong rounded-lg flex flex-col items-center justify-center gap-2">
          <p className="text-text-muted text-xs">Imagen</p>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 bg-accent/15 text-accent rounded-md text-[11px] font-medium cursor-pointer border-none hover:bg-accent/25 transition-colors"
            >
              Subir
            </button>
            <button
              onClick={handleUrl}
              className="px-3 py-1.5 bg-white/8 text-text-secondary rounded-md text-[11px] font-medium cursor-pointer border-none hover:bg-white/12 transition-colors"
            >
              URL
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default ImageBlock;
