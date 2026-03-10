import React, { useRef } from 'react';
import { BannerContent } from '../types';

interface Props {
  content: BannerContent;
  onChange: (content: BannerContent) => void;
  readOnly?: boolean;
}

const BannerBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...content, logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="w-full h-full rounded-lg flex items-center gap-3 px-4"
      style={{
        background: 'linear-gradient(135deg, rgba(0,191,99,0.2), #0d0d10, rgba(59,130,246,0.1))',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Logo */}
      {content.logoUrl ? (
        <img
          src={content.logoUrl}
          alt=""
          className="h-[60%] max-h-12 object-contain cursor-pointer shrink-0"
          onClick={() => !readOnly && logoRef.current?.click()}
        />
      ) : !readOnly ? (
        <button
          onClick={() => logoRef.current?.click()}
          className="w-10 h-10 rounded bg-white/10 border border-dashed border-white/20 text-[8px] text-white/40 cursor-pointer shrink-0 hover:bg-white/15 transition-colors"
        >
          Logo
        </button>
      ) : null}
      <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />

      {/* Text fields */}
      <div className="flex-1 min-w-0">
        {readOnly ? (
          <>
            <div className="text-white font-bold text-xs truncate">{content.title}</div>
            {content.subtitle && <div className="text-white/50 text-[9px] truncate">{content.subtitle}</div>}
            {content.date && <div className="text-white/30 text-[8px]">{content.date}</div>}
          </>
        ) : (
          <>
            <input
              type="text"
              value={content.title}
              onChange={e => onChange({ ...content, title: e.target.value })}
              placeholder="Titulo"
              className="w-full bg-transparent border-none outline-none text-white font-bold text-xs placeholder:text-white/30"
            />
            <input
              type="text"
              value={content.subtitle || ''}
              onChange={e => onChange({ ...content, subtitle: e.target.value })}
              placeholder="Subtitulo"
              className="w-full bg-transparent border-none outline-none text-white/50 text-[9px] placeholder:text-white/20 mt-0.5"
            />
            <input
              type="date"
              value={content.date || ''}
              onChange={e => onChange({ ...content, date: e.target.value })}
              className="bg-transparent border-none outline-none text-white/30 text-[8px] mt-0.5"
            />
          </>
        )}
      </div>

      {/* Player photo */}
      {content.photoUrl ? (
        <img
          src={content.photoUrl}
          alt=""
          className="h-[70%] max-h-12 aspect-square rounded-lg object-cover shrink-0 cursor-pointer"
          onClick={() => {
            if (readOnly) return;
            const url = prompt('URL de foto (vacio para quitar):', content.photoUrl);
            if (url === null) return;
            onChange({ ...content, photoUrl: url || undefined });
          }}
        />
      ) : !readOnly ? (
        <button
          onClick={() => {
            const url = prompt('URL de foto del jugador:');
            if (url) onChange({ ...content, photoUrl: url });
          }}
          className="w-10 h-10 rounded-lg bg-white/10 border border-dashed border-white/20 text-[7px] text-white/40 cursor-pointer shrink-0 hover:bg-white/15 transition-colors"
        >
          Foto
        </button>
      ) : null}
    </div>
  );
};

export default BannerBlock;
