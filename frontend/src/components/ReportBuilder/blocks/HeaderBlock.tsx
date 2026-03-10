import React from 'react';
import { HeaderContent } from '../types';

interface Props {
  content: HeaderContent;
  onChange: (content: HeaderContent) => void;
  readOnly?: boolean;
}

const HeaderBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const sizes: Record<number, string> = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-medium',
  };

  if (readOnly) {
    return <div className={`${sizes[content.level]} text-text`}>{content.text}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3].map(l => (
          <button
            key={l}
            onClick={() => onChange({ ...content, level: l as 1 | 2 | 3 })}
            className={`px-2 py-1 rounded text-xs font-medium cursor-pointer border-none transition-colors ${
              content.level === l ? 'bg-accent text-white' : 'bg-white/8 text-text-muted hover:bg-white/12'
            }`}
          >
            H{l}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={content.text}
        onChange={e => onChange({ ...content, text: e.target.value })}
        placeholder="Escribe el titulo..."
        className={`w-full bg-transparent border-none outline-none ${sizes[content.level]} text-text placeholder:text-text-muted`}
      />
    </div>
  );
};

export default HeaderBlock;
