import React, { useRef } from 'react';
import { CoverData } from './types';

interface Props {
  cover: CoverData;
  onChange: (cover: CoverData) => void;
  playerPhoto?: string;
}

const CoverEditor: React.FC<Props> = ({ cover, onChange, playerPhoto }) => {
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...cover, clubLogo: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="card-elevated rounded-xl overflow-hidden">
      {/* Cover Preview */}
      <div className="relative h-[200px] bg-gradient-to-br from-accent/20 via-surface to-info/10 flex items-center p-8">
        {/* Background image if exists */}
        {cover.playerPhoto && (
          <>
            <div
              className="absolute inset-0"
              style={{ backgroundImage: `url(${cover.playerPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent" />
          </>
        )}

        <div className="relative z-10 flex items-center gap-6 w-full">
          {/* Club Logo */}
          <div
            onClick={() => logoRef.current?.click()}
            className="w-20 h-20 rounded-xl bg-white/10 border border-border-strong flex items-center justify-center cursor-pointer hover:bg-white/15 transition-colors shrink-0"
          >
            {cover.clubLogo ? (
              <img src={cover.clubLogo} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-text-muted text-xs text-center">Logo<br/>Club</span>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

          {/* Title area */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={cover.title}
              onChange={e => onChange({ ...cover, title: e.target.value })}
              placeholder="Titulo del Informe"
              className="w-full bg-transparent border-none outline-none text-2xl font-bold text-text placeholder:text-text-muted/50"
            />
            <input
              type="text"
              value={cover.subtitle || ''}
              onChange={e => onChange({ ...cover, subtitle: e.target.value })}
              placeholder="Subtitulo (opcional)"
              className="w-full bg-transparent border-none outline-none text-sm text-text-secondary placeholder:text-text-muted/50 mt-1"
            />
            <input
              type="date"
              value={cover.date || ''}
              onChange={e => onChange({ ...cover, date: e.target.value })}
              className="bg-transparent border-none outline-none text-xs text-text-muted mt-2"
            />
          </div>

          {/* Player Photo */}
          {(cover.playerPhoto || playerPhoto) && (
            <img
              src={cover.playerPhoto || playerPhoto}
              alt="Player"
              className="w-24 h-24 rounded-xl object-cover border-2 border-border-strong shrink-0"
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border flex gap-3">
        <button
          onClick={() => {
            const url = prompt('URL de foto del jugador:');
            if (url) onChange({ ...cover, playerPhoto: url });
          }}
          className="px-3 py-1.5 bg-white/5 text-text-muted text-xs rounded-lg cursor-pointer border border-border-strong hover:bg-white/10 transition-colors"
        >
          {cover.playerPhoto ? 'Cambiar foto jugador' : 'Agregar foto jugador'}
        </button>
        {playerPhoto && !cover.playerPhoto && (
          <button
            onClick={() => onChange({ ...cover, playerPhoto: playerPhoto })}
            className="px-3 py-1.5 bg-accent/15 text-accent text-xs rounded-lg cursor-pointer border-none hover:bg-accent/25 transition-colors"
          >
            Usar foto de Wyscout
          </button>
        )}
      </div>
    </div>
  );
};

export default CoverEditor;
