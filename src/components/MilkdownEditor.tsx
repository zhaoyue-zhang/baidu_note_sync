import { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

interface Props {
  defaultValue?: string;
  onChange?: () => void;
}

export interface MilkdownHandle {
  getMarkdown: () => Promise<string>;
}

export const MilkdownEditor = forwardRef<MilkdownHandle, Props>(function MilkdownEditor(
  { defaultValue = '', onChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!containerRef.current || crepeRef.current) return;

    const crepe = new Crepe({
      root: containerRef.current,
      defaultValue,
    });
    crepeRef.current = crepe;

    crepe.create().then(() => {
      setMounted(true);
    });

    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!crepeRef.current || !mounted) return;

    crepeRef.current.on((listener) => {
      listener.markdownUpdated(() => {
        onChange?.();
      });
    });
  }, [mounted, onChange]);

  useImperativeHandle(ref, () => ({
    getMarkdown: async () => {
      if (!crepeRef.current) return defaultValue;
      return crepeRef.current.getMarkdown();
    },
  }), [defaultValue]);

  return (
    <div className="milkdown-wrapper">
      <div ref={containerRef} className="milkdown-container" />
    </div>
  );
});
