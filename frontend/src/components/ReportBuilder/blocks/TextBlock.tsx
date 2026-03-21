import React from 'react';
import { TextContent } from '../types';
import RichTextEditor from './RichTextEditor';

interface Props {
  content: TextContent;
  onChange: (content: TextContent) => void;
  readOnly?: boolean;
  defaultColor?: string;
  isSelected?: boolean;
}

const TextBlock: React.FC<Props> = ({ content, onChange, readOnly, defaultColor = '#d1d5db', isSelected = false }) => {
  const ts = content.textStyle || {};
  const align = ts.align || 'left';

  if (readOnly) {
    return (
      <div
        className="whitespace-pre-wrap"
        style={{ color: defaultColor, fontSize: '14px', lineHeight: 1.6, textAlign: align }}
        dangerouslySetInnerHTML={{ __html: content.text }}
      />
    );
  }

  return (
    <RichTextEditor
      html={content.text}
      onChange={text => onChange({ ...content, text })}
      placeholder="Escribe aqui..."
      style={{ fontSize: '14px', color: defaultColor, lineHeight: 1.6 }}
      align={align}
      onAlignChange={a => onChange({ ...content, textStyle: { ...ts, align: a } })}
      showToolbar={isSelected}
    />
  );
};

export default TextBlock;
