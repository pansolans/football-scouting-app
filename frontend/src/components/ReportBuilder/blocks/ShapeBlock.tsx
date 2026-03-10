import React from 'react';
import { ShapeContent } from '../types';

interface Props {
  content: ShapeContent;
  onChange: (content: ShapeContent) => void;
  readOnly?: boolean;
}

const ShapeBlock: React.FC<Props> = ({ content }) => {
  const c = {
    backgroundColor: content.backgroundColor || '#00bf63',
    opacity: content.opacity ?? 100,
    borderRadius: content.borderRadius ?? 0,
    borderColor: content.borderColor || 'transparent',
    borderWidth: content.borderWidth ?? 0,
    label: content.label || '',
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        backgroundColor: c.backgroundColor,
        opacity: c.opacity / 100,
        borderRadius: `${c.borderRadius}px`,
        border: c.borderWidth > 0 ? `${c.borderWidth}px solid ${c.borderColor}` : 'none',
      }}
    >
      {c.label && (
        <span className="text-white font-semibold text-sm drop-shadow-md px-2 text-center break-words">
          {c.label}
        </span>
      )}
    </div>
  );
};

export default ShapeBlock;
