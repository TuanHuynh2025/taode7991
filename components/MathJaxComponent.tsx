import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface Props {
  content: string;
  className?: string;
}

const MathJaxComponent: React.FC<Props> = ({ content, className }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise && nodeRef.current) {
      // Clean previous rendering if needed, though usually MathJax handles updates well
      nodeRef.current.innerHTML = content;
      window.MathJax.typesetPromise([nodeRef.current]).catch((err: any) => console.error(err));
    } else if (nodeRef.current) {
        nodeRef.current.innerHTML = content;
    }
  }, [content]);

  return <div ref={nodeRef} className={className} />;
};

export default MathJaxComponent;