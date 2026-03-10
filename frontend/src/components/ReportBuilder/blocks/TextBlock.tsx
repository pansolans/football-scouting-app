import React, { useRef, useEffect } from 'react';
import { TextContent, TextStyle } from '../types';

interface Props {
  content: TextContent;
  onChange: (content: TextContent) => void;
  readOnly?: boolean;
}

const COLORS = ['#ffffff', '#d1d5db', '#9ca3af', '#00bf63', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

const TextBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const ts = content.textStyle || {};
  const fontSize = ts.fontSize || 14;
  const color = ts.color || '#d1d5db';
  const align = ts.align || 'left';

  const updateStyle = (partial: Partial<TextStyle>) => {
    onChange({ ...content, textStyle: { ...ts, ...partial } });
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [content.text]);

  const style: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    color,
    textAlign: align,
    fontWeight: ts.bold ? 'bold' : 'normal',
    fontStyle: ts.italic ? 'italic' : 'normal',
    lineHeight: 1.6,
  };

  if (readOnly) {
    return <p className="whitespace-pre-wrap m-0" style={style}>{content.text}</p>;
  }

  return (
    <div className="space-y-1.5 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Bold / Italic */}
        <button onClick={() => updateStyle({ bold: !ts.bold })} className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer border-none ${ts.bold ? 'bg-white/15 text-white' : 'bg-white/5 text-text-muted'}`}>B</button>
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
          onChange={e => updateStyle({ fontSize: Math.max(8, Math.min(48, parseInt(e.target.value) || 14)) })}
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
      {/* Textarea */}
      <textarea
        ref={ref}
        value={content.text}
        onChange={e => onChange({ ...content, text: e.target.value })}
        placeholder="Escribe aqui..."
        rows={2}
        style={style}
        className="w-full bg-transparent border border-white/5 rounded-lg p-2 placeholder:text-white/20 outline-none focus:border-accent/30 resize-none whitespace-pre-wrap"
      />
    </div>
  );
};

export default TextBlock;
