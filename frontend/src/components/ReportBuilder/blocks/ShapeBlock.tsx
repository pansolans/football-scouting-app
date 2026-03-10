import React, { useState } from 'react';
import { ShapeContent } from '../types';

interface Props {
  content: ShapeContent;
  onChange: (content: ShapeContent) => void;
  readOnly?: boolean;
}

const PRESET_COLORS = [
  '#00bf63', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#ffffff', '#6b7280', '#0d0d10',
];

const ShapeBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const [showEditor, setShowEditor] = useState(false);

  const c = {
    backgroundColor: content.backgroundColor || '#00bf63',
    opacity: content.opacity ?? 100,
    borderRadius: content.borderRadius ?? 0,
    borderColor: content.borderColor || 'transparent',
    borderWidth: content.borderWidth ?? 0,
    label: content.label || '',
  };

  return (
    <div className="w-full h-full relative">
      {/* The shape itself */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          backgroundColor: c.backgroundColor,
          opacity: c.opacity / 100,
          borderRadius: `${c.borderRadius}px`,
          border: c.borderWidth > 0 ? `${c.borderWidth}px solid ${c.borderColor}` : 'none',
        }}
        onDoubleClick={() => !readOnly && setShowEditor(!showEditor)}
      >
        {c.label && (
          <span className="text-white font-semibold text-sm drop-shadow-md px-2 text-center break-words">
            {c.label}
          </span>
        )}
      </div>

      {/* Editor panel */}
      {showEditor && !readOnly && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a24] border border-white/15 rounded-lg p-3 shadow-xl min-w-[220px]"
          onClick={e => e.stopPropagation()}
        >
          {/* Color presets */}
          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1.5">Color</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => onChange({ ...c, backgroundColor: color })}
                  className="w-6 h-6 rounded cursor-pointer border-none transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outline: c.backgroundColor === color ? '2px solid #00bf63' : '1px solid rgba(255,255,255,0.2)',
                    outlineOffset: '1px',
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={c.backgroundColor}
              onChange={e => onChange({ ...c, backgroundColor: e.target.value })}
              className="w-full h-7 rounded cursor-pointer border border-white/10"
            />
          </div>

          {/* Opacity */}
          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
              Opacidad: {c.opacity}%
            </label>
            <input
              type="range" min="5" max="100" value={c.opacity}
              onChange={e => onChange({ ...c, opacity: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-[#00bf63]"
            />
          </div>

          {/* Border radius */}
          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
              Redondeo: {c.borderRadius}px
            </label>
            <input
              type="range" min="0" max="50" value={c.borderRadius}
              onChange={e => onChange({ ...c, borderRadius: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-[#00bf63]"
            />
          </div>

          {/* Border */}
          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">
              Borde: {c.borderWidth}px
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range" min="0" max="8" value={c.borderWidth}
                onChange={e => onChange({ ...c, borderWidth: parseInt(e.target.value) })}
                className="flex-1 h-1.5 accent-[#00bf63]"
              />
              {c.borderWidth > 0 && (
                <input
                  type="color"
                  value={c.borderColor === 'transparent' ? '#ffffff' : c.borderColor}
                  onChange={e => onChange({ ...c, borderColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-white/10"
                />
              )}
            </div>
          </div>

          {/* Label */}
          <div className="mb-2">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Texto (opcional)</label>
            <input
              type="text"
              value={c.label}
              onChange={e => onChange({ ...c, label: e.target.value })}
              placeholder="Texto dentro..."
              className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-[11px] text-white placeholder:text-white/30 outline-none focus:border-[#00bf63]/50"
            />
          </div>

          <button
            onClick={() => setShowEditor(false)}
            className="w-full mt-1 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-[10px] rounded cursor-pointer border-none transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default ShapeBlock;
