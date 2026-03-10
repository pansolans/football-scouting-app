import React, { useRef } from 'react';
import { CoverData, BlockType } from './types';

interface Props {
  cover: CoverData;
  onChange: (cover: CoverData) => void;
  onAddCoverBlock: (type: BlockType) => void;
  playerPhoto?: string;
}

const CoverEditor: React.FC<Props> = ({ cover, onChange, onAddCoverBlock, playerPhoto }) => {
  const bgRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...cover, backgroundImage: reader.result as string });
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
        <p className="text-[10px] text-text-muted">Activa para agregar una portada.</p>
      )}

      {enabled && (
        <div className="space-y-3 mt-2">
          {/* Background image */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Imagen de fondo</label>
            {cover.backgroundImage ? (
              <div className="relative rounded-lg overflow-hidden h-[70px]">
                <img src={cover.backgroundImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                  <button onClick={() => bgRef.current?.click()} className="px-2 py-1 bg-white/20 text-white text-[10px] rounded cursor-pointer border-none hover:bg-white/30">Cambiar</button>
                  <button onClick={() => onChange({ ...cover, backgroundImage: undefined })} className="px-2 py-1 bg-red-500/30 text-red-300 text-[10px] rounded cursor-pointer border-none hover:bg-red-500/50">Quitar</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => bgRef.current?.click()} className="flex-1 py-2.5 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-text-muted cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                  Subir imagen
                </button>
                <button onClick={() => { const url = prompt('URL de la imagen:'); if (url) onChange({ ...cover, backgroundImage: url }); }} className="flex-1 py-2.5 bg-white/5 border border-dashed border-white/20 rounded-lg text-[10px] text-text-muted cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                  Pegar URL
                </button>
              </div>
            )}
            <input ref={bgRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
          </div>

          {/* Overlay opacity */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
              Oscurecer: {cover.overlayOpacity ?? 60}%
            </label>
            <input
              type="range" min="0" max="90" value={cover.overlayOpacity ?? 60}
              onChange={e => onChange({ ...cover, overlayOpacity: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-[#00bf63]"
            />
          </div>

          {/* Add elements to cover */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1.5">Agregar a portada</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => onAddCoverBlock('header')} className="py-2 bg-white/5 border border-white/10 rounded text-[10px] text-text-secondary cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                Titulo
              </button>
              <button onClick={() => onAddCoverBlock('text')} className="py-2 bg-white/5 border border-white/10 rounded text-[10px] text-text-secondary cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                Texto
              </button>
              <button onClick={() => onAddCoverBlock('image')} className="py-2 bg-white/5 border border-white/10 rounded text-[10px] text-text-secondary cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                Imagen
              </button>
              <button onClick={() => onAddCoverBlock('shape')} className="py-2 bg-white/5 border border-white/10 rounded text-[10px] text-text-secondary cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                Forma
              </button>
              <button onClick={() => onAddCoverBlock('divider')} className="py-2 bg-white/5 border border-white/10 rounded text-[10px] text-text-secondary cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                Separador
              </button>
            </div>
          </div>

          {/* Cover blocks count */}
          <p className="text-[9px] text-text-muted">{(cover.blocks || []).length} elementos en la portada. Selecciona la tab "Portada" para editarlos.</p>
        </div>
      )}
    </div>
  );
};

export default CoverEditor;
