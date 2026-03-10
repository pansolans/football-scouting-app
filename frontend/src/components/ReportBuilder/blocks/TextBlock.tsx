import React from 'react';
import { TextContent } from '../types';
import RichTextEditor from './RichTextEditor';

interface Props {
  content: TextContent;
  onChange: (content: TextContent) => void;
  readOnly?: boolean;
}

const TextBlock: React.FC<Props> = ({ content, onChange, readOnly }) => {
  const ts = content.textStyle || {};
  const align = ts.align || 'left';

  if (readOnly) {
    return (
      <div
        className="whitespace-pre-wrap"
        style={{ color: '#d1d5db', fontSize: '14px', lineHeight: 1.6, textAlign: align }}
        dangerouslySetInnerHTML={{ __html: content.text }}
      />
    );
  }

  return (
    <RichTextEditor
      html={content.text}
      onChange={text => onChange({ ...content, text })}
      placeholder="Escribe aqui..."
      style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.6 }}
      align={align}
      onAlignChange={a => onChange({ ...content, textStyle: { ...ts, align: a } })}
    />
  );
};

export default TextBlock;
