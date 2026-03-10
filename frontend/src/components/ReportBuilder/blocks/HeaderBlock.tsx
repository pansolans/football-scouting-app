import React from 'react';
import { HeaderContent, TextStyle } from '../types';

interface Props {
  content: HeaderContent;
  onChange: (content: HeaderContent) => void;
  readOnly?: boolean;
}

const COLORS = ['#ffffff', '#00bf63', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#d1d5db', '#6b7280'];

const HeaderBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const ts = content.textStyle || {};
  const defaultSizes: Record<number, number> = { 1: 30, 2: 24, 3: 18 };
  const fontSize = ts.fontSize || defaultSizes[content.level] || 24;
  const color = ts.color || '#ffffff';
  const align = ts.align || 'left';

  const updateStyle = (partial: Partial<TextStyle>) => {
    onChange({ ...content, textStyle: { ...ts, ...partial } });
  };

  const style: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    color,
    textAlign: align,
    fontWeight: ts.bold !== false ? 'bold' : 'normal',
    fontStyle: ts.italic ? 'italic' : 'normal',
  };

  if (readOnly) {
    return <div style={style}>{content.text}</div>;
  }

  return (
    <div className="space-y-1.5 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Level */}
        {[1, 2, 3].map(l => (
          <button
            key={l}
            onClick={() => onChange({ ...content, level: l as 1 | 2 | 3, textStyle: { ...ts, fontSize: defaultSizes[l] } })}
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium cursor-pointer border-none transition-colors ${
              content.level === l ? 'bg-accent text-white' : 'bg-white/8 text-text-muted hover:bg-white/12'
            }`}
          >
            H{l}
          </button>
        ))}
        <span className="w-px h-4 bg-white/10" />
        {/* Bold / Italic */}
        <button onClick={() => updateStyle({ bold: ts.bold === false ? undefined : false })} className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer border-none ${ts.bold !== false ? 'bg-white/15 text-white' : 'bg-white/5 text-text-muted'}`}>B</button>
        <button onClick={() => updateStyle({ italic: !ts.italic })} className={`px-1.5 py-0.5 rounded text-[9px] italic cursor-pointer border-none ${ts.italic ? 'bg-white/15 text-white' : 'bg-white/5 text-text-muted'}`}>I</button>
        <span className="w-px h-4 bg-white/10" />
        {/* Align */}
        {(['left', 'center', 'right'] as const).map(a => (
          <button key={a} onClick={() => updateStyle({ align: a })} className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer border-none ${align === a ? 'bg-white/15 text-white' : 'bg-white/5 text-text-muted'}`}>
            {a === 'left' ? '⫷' : a === 'center' ? '⫿' : '⫸'}
          </button>
        ))}
        <span className="w-px h-4 bg-white/10" />
        {/* Font size */}
        <input
          type="number"
          value={fontSize}
          onChange={e => updateStyle({ fontSize: Math.max(10, Math.min(72, parseInt(e.target.value) || 24)) })}
          className="w-10 px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white text-center outline-none"
          title="Tamaño"
        />
        <span className="text-[8px] text-white/30">px</span>
        <span className="w-px h-4 bg-white/10" />
        {/* Colors */}
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => updateStyle({ color: c })}
            className="w-4 h-4 rounded-sm cursor-pointer border-none hover:scale-125 transition-transform"
            style={{ backgroundColor: c, outline: color === c ? '2px solid #00bf63' : '1px solid rgba(255,255,255,0.15)', outlineOffset: '1px' }}
          />
        ))}
        <input type="color" value={color} onChange={e => updateStyle({ color: e.target.value })} className="w-5 h-4 rounded cursor-pointer border border-white/10" />
      </div>
      {/* Input */}
      <input
        type="text"
        value={content.text}
        onChange={e => onChange({ ...content, text: e.target.value })}
        placeholder="Escribe el titulo..."
        style={style}
        className="w-full bg-transparent border-none outline-none placeholder:text-white/20"
      />
    </div>
  );
};

export default HeaderBlock;
