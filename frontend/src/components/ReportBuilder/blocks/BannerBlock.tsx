import React, { useRef } from 'react';
import { BannerContent } from '../types';

interface Props {
  content: BannerContent;
  onChange: (content: BannerContent) => void;
  readOnly?: boolean;
}

const BannerBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, key: 'logoUrl' | 'photoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...content, [key]: reader.result as string });
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
      <input ref={logoRef} type="file" accept="image/*" onChange={e => handleFile(e, 'logoUrl')} className="hidden" />

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
              placeholder="Subtitulo (opcional)"
              className="w-full bg-transparent border-none outline-none text-white/50 text-[9px] placeholder:text-white/20 mt-0.5"
            />
            <input
              type="text"
              value={content.date || ''}
              onChange={e => onChange({ ...content, date: e.target.value })}
              placeholder="Fecha u otro texto (opcional)"
              className="w-full bg-transparent border-none outline-none text-white/30 text-[8px] placeholder:text-white/15 mt-0.5"
            />
          </>
        )}
      </div>

      {/* Player photo */}
      {content.photoUrl ? (
        <div className="relative shrink-0 group/photo">
          <img
            src={content.photoUrl}
            alt=""
            className="h-[70%] max-h-12 aspect-square rounded-lg object-cover"
          />
          {!readOnly && (
            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button onClick={() => photoRef.current?.click()} className="text-[7px] text-white/80 cursor-pointer border-none bg-transparent hover:text-white">Cambiar</button>
              <button onClick={() => onChange({ ...content, photoUrl: undefined })} className="text-[7px] text-red-400/80 cursor-pointer border-none bg-transparent hover:text-red-400">Quitar</button>
            </div>
          )}
        </div>
      ) : !readOnly ? (
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => photoRef.current?.click()}
            className="w-10 h-5 rounded bg-white/10 border border-dashed border-white/20 text-[6px] text-white/40 cursor-pointer hover:bg-white/15 transition-colors"
          >
            Subir
          </button>
          <button
            onClick={() => {
              const url = prompt('URL de foto del jugador:');
              if (url) onChange({ ...content, photoUrl: url });
            }}
            className="w-10 h-5 rounded bg-white/10 border border-dashed border-white/20 text-[6px] text-white/40 cursor-pointer hover:bg-white/15 transition-colors"
          >
            URL
          </button>
        </div>
      ) : null}
      <input ref={photoRef} type="file" accept="image/*" onChange={e => handleFile(e, 'photoUrl')} className="hidden" />
    </div>
  );
};

export default BannerBlock;
