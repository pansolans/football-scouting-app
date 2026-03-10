import React, { useRef } from 'react';
import { CoverData, BlockType } from './types';

interface Props {
  cover: CoverData;
  onChange: (cover: CoverData) => void;
  onAddCoverBlock: (type: BlockType) => void;
  playerPhoto?: string;
}

const CoverEditor: React.FC<Props> = ({ cover, onChange, onAddCoverBlock }) => {
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
        <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-medium">Portada (opcional)</h4>
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
        <p className="text-[10px] text-text-muted">Activa para agregar una pagina de portada con fondo.</p>
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

          {/* Background zoom & position */}
          {cover.backgroundImage && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
                  Zoom: {cover.bgZoom ?? 100}%
                </label>
                <input
                  type="range" min="100" max="300" step="5" value={cover.bgZoom ?? 100}
                  onChange={e => onChange({ ...cover, bgZoom: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-[#00bf63]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
                    Pos. horizontal: {cover.bgPositionX ?? 50}%
                  </label>
                  <input
                    type="range" min="0" max="100" value={cover.bgPositionX ?? 50}
                    onChange={e => onChange({ ...cover, bgPositionX: parseInt(e.target.value) })}
                    className="w-full h-1.5 accent-[#00bf63]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
                    Pos. vertical: {cover.bgPositionY ?? 50}%
                  </label>
                  <input
                    type="range" min="0" max="100" value={cover.bgPositionY ?? 50}
                    onChange={e => onChange({ ...cover, bgPositionY: parseInt(e.target.value) })}
                    className="w-full h-1.5 accent-[#00bf63]"
                  />
                </div>
              </div>
            </div>
          )}

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
              {(['header', 'text', 'image', 'shape', 'banner', 'divider'] as BlockType[]).map(type => {
                const labels: Record<string, string> = { header: 'Titulo', text: 'Texto', image: 'Imagen', shape: 'Forma', banner: 'Barra', divider: 'Separador' };
                return (
                  <button key={type} onClick={() => onAddCoverBlock(type)} className="py-2 bg-white/5 border border-white/10 rounded text-[10px] text-text-secondary cursor-pointer hover:bg-white/10 hover:border-accent/30 transition-all">
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[9px] text-text-muted">{(cover.blocks || []).length} elementos. Selecciona "Portada" para editarlos.</p>
        </div>
      )}
    </div>
  );
};

export default CoverEditor;
