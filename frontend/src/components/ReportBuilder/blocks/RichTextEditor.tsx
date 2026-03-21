import React, { useRef, useEffect, useCallback, useState } from 'react';

interface Props {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  singleLine?: boolean;
  align?: 'left' | 'center' | 'right';
  onAlignChange?: (align: 'left' | 'center' | 'right') => void;
}

const COLORS = ['#ffffff', '#d1d5db', '#9ca3af', '#00bf63', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

const FONTS = [
  { label: 'Sans', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: '"Courier New", Courier, monospace' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Oswald', value: 'Oswald, sans-serif' },
  { label: 'Playfair', value: '"Playfair Display", serif' },
];

const RichTextEditor: React.FC<Props> = ({
  html, onChange, placeholder, style, singleLine, align = 'left', onAlignChange,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(html);
  const savedRange = useRef<Range | null>(null);
  const [fontSize, setFontSize] = useState(style?.fontSize ? parseInt(String(style.fontSize)) : 14);

  // Set initial content on mount
  useEffect(() => {
    if (ref.current && html) {
      ref.current.innerHTML = html;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external html changes into the div
  useEffect(() => {
    if (ref.current && html !== lastHtml.current) {
      ref.current.innerHTML = html || '';
      lastHtml.current = html;
    }
  }, [html]);

  // Track selection for when inputs steal focus
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
        // Detect font size of selection
        const node = sel.anchorNode;
        const el = node?.nodeType === 3 ? node.parentElement : node as HTMLElement;
        if (el) {
          const size = parseInt(window.getComputedStyle(el).fontSize);
          if (size && size !== fontSize) setFontSize(size);
        }
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [fontSize]);

  const sync = useCallback(() => {
    if (ref.current) {
      const h = ref.current.innerHTML;
      if (h !== lastHtml.current) {
        lastHtml.current = h;
        onChange(h === '<br>' ? '' : h);
      }
    }
  }, [onChange]);

  const restoreSelection = () => {
    if (savedRange.current && ref.current) {
      ref.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
    }
  };

  // Execute command preserving editor focus (for toolbar buttons)
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    sync();
  };

  const applyFontSize = (size: number) => {
    // Use fontSize command with marker, then replace <font> with <span>
    document.execCommand('fontSize', false, '7');
    if (ref.current) {
      ref.current.querySelectorAll('font[size="7"]').forEach(font => {
        const span = document.createElement('span');
        span.style.fontSize = `${size}px`;
        while (font.firstChild) span.appendChild(font.firstChild);
        font.parentNode?.replaceChild(span, font);
      });
    }
    sync();
  };

  const applyFontFamily = (fontFamily: string) => {
    restoreSelection();
    document.execCommand('fontName', false, fontFamily);
    sync();
  };

  // Prevent default on mouseDown to keep editor focused
  const pd = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="space-y-1.5 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        <button onMouseDown={pd} onClick={() => exec('bold')}
          className="px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer border-none bg-white/5 text-text-muted hover:bg-white/15 hover:text-white">B</button>
        <button onMouseDown={pd} onClick={() => exec('italic')}
          className="px-1.5 py-0.5 rounded text-[9px] italic cursor-pointer border-none bg-white/5 text-text-muted hover:bg-white/15 hover:text-white">I</button>
        <button onMouseDown={pd} onClick={() => exec('underline')}
          className="px-1.5 py-0.5 rounded text-[9px] underline cursor-pointer border-none bg-white/5 text-text-muted hover:bg-white/15 hover:text-white">U</button>
        <span className="w-px h-4 bg-white/10" />
        {/* Align */}
        {onAlignChange && <>
          {(['left', 'center', 'right'] as const).map(a => (
            <button key={a} onMouseDown={pd} onClick={() => onAlignChange(a)}
              className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer border-none ${align === a ? 'bg-white/15 text-white' : 'bg-white/5 text-text-muted'}`}>
              {a === 'left' ? '⫷' : a === 'center' ? '⫿' : '⫸'}
            </button>
          ))}
          <span className="w-px h-4 bg-white/10" />
        </>}
        {/* Font size */}
        <input
          type="number"
          value={fontSize}
          onChange={e => {
            const v = parseInt(e.target.value) || 14;
            setFontSize(v);
            if (v >= 8 && v <= 72) {
              restoreSelection();
              applyFontSize(v);
            }
          }}
          onMouseDown={e => e.stopPropagation()}
          className="w-10 px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white text-center outline-none"
          title="Tamaño"
        />
        <span className="text-[8px] text-white/30">px</span>
        <span className="w-px h-4 bg-white/10" />
        {/* Font family */}
        <select
          onChange={e => { restoreSelection(); applyFontFamily(e.target.value); }}
          onMouseDown={e => e.stopPropagation()}
          className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white outline-none cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>Fuente</option>
          {FONTS.map(f => (
            <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>
        <span className="w-px h-4 bg-white/10" />
        {/* Colors */}
        {COLORS.map(c => (
          <button
            key={c}
            onMouseDown={pd}
            onClick={() => exec('foreColor', c)}
            className="w-4 h-4 rounded-sm cursor-pointer border-none hover:scale-125 transition-transform"
            style={{ backgroundColor: c, outline: '1px solid rgba(255,255,255,0.15)', outlineOffset: '1px' }}
          />
        ))}
        <input type="color" onChange={e => { restoreSelection(); exec('foreColor', e.target.value); }}
          onMouseDown={e => e.stopPropagation()} className="w-5 h-4 rounded cursor-pointer border border-white/10" />
      </div>
      {/* Editor */}
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          onKeyDown={e => { if (singleLine && e.key === 'Enter') e.preventDefault(); }}
          onPaste={e => {
            e.preventDefault();
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
          }}
          style={{ ...style, textAlign: align }}
          className={`w-full bg-transparent border border-white/5 rounded-lg p-2 outline-none focus:border-accent/30 ${singleLine ? 'whitespace-nowrap overflow-hidden' : 'whitespace-pre-wrap min-h-[3em]'}`}
        />
        {!html && (
          <div className="absolute inset-0 p-2 text-white/20 pointer-events-none" style={{ ...style, textAlign: align }}>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
