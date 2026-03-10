import React from 'react';
import { HeaderContent } from '../types';
import RichTextEditor from './RichTextEditor';

interface Props {
  content: HeaderContent;
  onChange: (content: HeaderContent) => void;
  readOnly?: boolean;
}

const DEFAULT_SIZES: Record<number, number> = { 1: 30, 2: 24, 3: 18 };

const HeaderBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const ts = content.textStyle || {};
  const fontSize = DEFAULT_SIZES[content.level] || 24;
  const align = ts.align || 'left';

  if (readOnly) {
    return (
      <div
        style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', color: '#ffffff', textAlign: align }}
        dangerouslySetInnerHTML={{ __html: content.text }}
      />
    );
  }

  return (
    <div className="space-y-1 h-full">
      {/* Level selector */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map(l => (
          <button
            key={l}
            onClick={() => onChange({ ...content, level: l as 1 | 2 | 3 })}
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium cursor-pointer border-none transition-colors ${
              content.level === l ? 'bg-accent text-white' : 'bg-white/8 text-text-muted hover:bg-white/12'
            }`}
          >
            H{l}
          </button>
        ))}
      </div>
      <RichTextEditor
        html={content.text}
        onChange={text => onChange({ ...content, text })}
        placeholder="Escribe el titulo..."
        singleLine
        style={{ fontSize: `${fontSize}px`, color: '#ffffff', fontWeight: 'bold' }}
        align={align}
        onAlignChange={a => onChange({ ...content, textStyle: { ...ts, align: a } })}
      />
    </div>
  );
};

export default HeaderBlock;
