import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

declare global {
  interface Window {
    editormd: any;
    $: any;
  }
}

interface Props {
  defaultValue?: string;
  id: string;
}

export interface EditormdHandle {
  getMarkdown: () => string;
}

export const EditormdEditor = forwardRef<EditormdHandle, Props>(function EditormdEditor(
  { defaultValue = '', id },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const editormd = (window as any).editormd;
    if (!editormd) {
      console.warn('editormd not loaded');
      return;
    }

    // Wait for DOM
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (editorRef.current) return;

      const h = Math.max(400, window.innerHeight - 280);
      el.style.height = h + 'px';

      try {
        editorRef.current = editormd(id, {
          width: '100%',
          height: h,
          path: 'https://cdn.jsdelivr.net/npm/editor.md@1.5.0/lib/',
          markdown: defaultValue,
          toolbar: true,
          placeholder: '开始写作...',
          imageUpload: false,
          emoji: true,
          tocm: true,
          tex: true,
          onload() {
            setReady(true);
          },
        });
      } catch (e) {
        console.error('editormd init error:', e);
      }
    });
  }, [id]);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      if (!editorRef.current) return defaultValue;
      try {
        return editorRef.current.getMarkdown();
      } catch {
        return (document.getElementById(id)?.querySelector('textarea') as HTMLTextAreaElement)?.value || defaultValue;
      }
    },
  }), [defaultValue, id]);

  return (
    <div ref={containerRef} className="editor-md-container">
      <div id={id}>
        {!ready && (
          <textarea
            defaultValue={defaultValue}
            style={{
              width: '100%',
              minHeight: '300px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              resize: 'vertical',
            }}
            placeholder="开始写作..."
          />
        )}
      </div>
    </div>
  );
});
