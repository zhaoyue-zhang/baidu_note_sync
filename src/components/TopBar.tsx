import type { ReactNode } from 'react';

type TopBarProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
};

export function TopBar({ title, subtitle, left, right }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-side">{left}</div>
      <div className="topbar-main">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="topbar-side topbar-right">{right}</div>
    </header>
  );
}
