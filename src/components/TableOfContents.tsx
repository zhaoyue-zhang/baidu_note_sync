import { useEffect, useState, useCallback, useRef } from 'react';

export type TocItem = { level: number; text: string };

export function parseToc(markdown: string): TocItem[] {
  if (!markdown) return [];
  return markdown
    .split('\n')
    .filter((line) => /^#{1,6}\s/.test(line))
    .map((line) => {
      const m = line.match(/^(#{1,6})\s+(.+)$/);
      return { level: m![1].length, text: m![2].trim() };
    });
}

export function scrollToHeading(text: string) {
  const editor = document.querySelector('.milkdown .ProseMirror');
  if (!editor) return;
  const headings = editor.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const h of headings) {
    if (h.textContent?.trim() === text) {
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
  }
}

interface Props {
  items: TocItem[];
  open: boolean;
  onToggle: () => void;
  wordCount?: number;
}

export function TableOfContents({ items, open, onToggle, wordCount = 0 }: Props) {
  if (!open) {
    return (
      <aside className="toc-panel toc-collapsed">
        <button className="toc-toggle" onClick={onToggle} title="展开目录">
          ☰
        </button>
      </aside>
    );
  }

  return (
    <aside className="toc-panel">
      <div className="toc-header">
        <span className="toc-title">目录</span>
        <button className="toc-close" onClick={onToggle}>×</button>
      </div>
      <div className="toc-body">
        {items.length === 0 ? (
          <div className="toc-empty">暂无标题</div>
        ) : (
          <ul className="toc-list">
            {items.map((item, i) => (
              <li
                key={i}
                className="toc-item"
                style={{ paddingLeft: `${(item.level - 1) * 14 + 8}px` }}
                onClick={() => scrollToHeading(item.text)}
              >
                <span className="toc-dot" />
                <span className="toc-text">{item.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="toc-footer">{wordCount} 词</div>
    </aside>
  );
}
