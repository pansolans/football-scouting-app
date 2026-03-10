import React, { useRef, useEffect } from 'react';
import { TextContent } from '../types';

interface Props {
  content: TextContent;
  onChange: (content: TextContent) => void;
  readOnly?: boolean;
}

const TextBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [content.text]);

  if (readOnly) {
    return <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap m-0">{content.text}</p>;
  }

  return (
    <textarea
      ref={ref}
      value={content.text}
      onChange={e => onChange({ ...content, text: e.target.value })}
      placeholder="Escribe aqui tu analisis, observaciones..."
      rows={3}
      className="w-full bg-transparent border border-border-strong rounded-lg p-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent/50 resize-none leading-relaxed"
    />
  );
};

export default TextBlock;
