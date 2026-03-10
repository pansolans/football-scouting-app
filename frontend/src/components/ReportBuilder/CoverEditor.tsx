import React, { useRef } from 'react';
import { CoverData } from './types';

interface Props {
  cover: CoverData;
  onChange: (cover: CoverData) => void;
  playerPhoto?: string;
}

const CoverEditor: React.FC<Props> = ({ cover, onChange, playerPhoto }) => {
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, key: 'clubLogo' | 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...cover, [key]: reader.result as string });
    reader.readAsDataURL(file);
  };

  const enabled = cover.enabled ?? false;

  return (
    <div className="card-elevated rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-medium">Portada</h4>
        <button
          onClick={() => onChange({ ...cover, enabled: !enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-none ${
            enabled ? 'bg-accent' : 'bg-white/15'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'left-[18px]' : 'left-0.5'
          }`} />
        </button>
      </div>

      {!enabled && (
        <p className="text-[10px] text-text-muted">Activa para agregar una portada de pagina completa al informe.</p>
      )}

      {enabled && (
        <div className="space-y-3 mt-2">
          {/* Background image */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Imagen de fondo</label>
            {cover.backgroundImage ? (
              <div className="relative rounded-lg overflow-hidden h-[80px]">
                <img src={cover.backgroundImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                  <button
                    onClick={() => bgRef.current?.click()}
                    className="px-2 py-1 bg-white/20 text-white text-[10px] rounded cursor-pointer border-none hover:bg-white/30"
                  >
                    Cambiar
                  </button>
                  <button
                    onClick={() => onChange({ ...cover, backgroundImage: undefined })}
                    className="px-2 py-1 bg-red-500/30 text-red-300 text-[10px] rounded cursor-pointer border-none hover:bg-red-500/50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => bgRef.current?.click()}
                  className="flex-1 py-3 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-text-muted cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all"
                >
                  Subir imagen
                </button>
                <button
                  onClick={() => {
                    const url = prompt('URL de la imagen:');
                    if (url) onChange({ ...cover, backgroundImage: url });
                  }}
                  className="flex-1 py-3 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-text-muted cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all"
                >
                  Pegar URL
                </button>
              </div>
            )}
            <input ref={bgRef} type="file" accept="image/*" onChange={e => handleFile(e, 'backgroundImage')} className="hidden" />
          </div>

          {/* Overlay opacity */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
              Oscurecer fondo: {cover.overlayOpacity ?? 60}%
            </label>
            <input
              type="range" min="0" max="90" value={cover.overlayOpacity ?? 60}
              onChange={e => onChange({ ...cover, overlayOpacity: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-[#00bf63]"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Titulo</label>
            <input
              type="text"
              value={cover.title}
              onChange={e => onChange({ ...cover, title: e.target.value })}
              placeholder="Titulo del informe"
              className="w-full p-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Subtitulo</label>
            <input
              type="text"
              value={cover.subtitle || ''}
              onChange={e => onChange({ ...cover, subtitle: e.target.value })}
              placeholder="Subtitulo (opcional)"
              className="w-full p-2 bg-white/5 border border-white/10 rounded-md text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-accent/50"
            />
          </div>

          {/* Title alignment */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Alineacion</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => onChange({ ...cover, titleAlign: align })}
                  className={`flex-1 py-1.5 rounded text-[10px] cursor-pointer border-none transition-colors ${
                    (cover.titleAlign || 'center') === align
                      ? 'bg-accent/25 text-accent'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Fecha</label>
            <input
              type="date"
              value={cover.date || ''}
              onChange={e => onChange({ ...cover, date: e.target.value })}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-md text-xs text-white/70 outline-none focus:border-accent/50"
            />
          </div>

          {/* Club logo */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Logo del club</label>
            <div className="flex items-center gap-2">
              {cover.clubLogo ? (
                <>
                  <img src={cover.clubLogo} alt="" className="w-10 h-10 object-contain bg-white/5 rounded-lg p-1" />
                  <button onClick={() => logoRef.current?.click()} className="px-2 py-1 bg-white/5 text-white/50 text-[10px] rounded cursor-pointer border-none hover:bg-white/10">Cambiar</button>
                  <button onClick={() => onChange({ ...cover, clubLogo: undefined })} className="px-2 py-1 text-red-400/60 text-[10px] cursor-pointer border-none bg-transparent hover:text-red-400">Quitar</button>
                </>
              ) : (
                <button onClick={() => logoRef.current?.click()} className="py-2 px-3 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-text-muted cursor-pointer hover:bg-white/10 transition-all">
                  Subir logo
                </button>
              )}
              <input ref={logoRef} type="file" accept="image/*" onChange={e => handleFile(e, 'clubLogo')} className="hidden" />
            </div>
          </div>

          {/* Player photo */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Foto del jugador</label>
            <div className="flex items-center gap-2 flex-wrap">
              {cover.playerPhoto ? (
                <>
                  <img src={cover.playerPhoto} alt="" className="w-10 h-10 object-cover rounded-lg" />
                  <button onClick={() => onChange({ ...cover, playerPhoto: undefined })} className="px-2 py-1 text-red-400/60 text-[10px] cursor-pointer border-none bg-transparent hover:text-red-400">Quitar</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { const url = prompt('URL de foto:'); if (url) onChange({ ...cover, playerPhoto: url }); }}
                    className="py-2 px-3 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-text-muted cursor-pointer hover:bg-white/10 transition-all"
                  >
                    Agregar foto
                  </button>
                  {playerPhoto && (
                    <button onClick={() => onChange({ ...cover, playerPhoto })} className="py-2 px-3 bg-accent/15 text-accent text-[10px] rounded-lg cursor-pointer border-none hover:bg-accent/25">
                      Usar de Wyscout
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverEditor;
