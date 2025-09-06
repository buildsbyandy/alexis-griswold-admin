import React from 'react';

type ChipProps = {
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  count?: number;
  variant?: 'tan' | 'black';
};

export function Chip({
  href, active, icon, children, count, variant = 'tan'
}: ChipProps) {
  const base = "inline-flex w-full justify-center items-center gap-1.5 rounded-full px-3 py-2 text-sm whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 min-h-[44px]";
  const tan = active
    ? "bg-[var(--chip-active,#A27D4C)] text-white focus-visible:outline-[var(--chip-active,#A27D4C)]"
    : "bg-[var(--chip-bg)] text-[var(--chip-fg)] hover:bg-[#e4d8ca] focus-visible:outline-[var(--chip-outline,#A27D4C)]";

  const black = active
    ? "bg-[var(--chip-black-bg)] text-[var(--chip-black-fg)] focus-visible:outline-[var(--chip-outline)]"
    : "bg-[var(--chip-black-bg)] text-[var(--chip-black-fg)] hover:bg-[var(--chip-black-hover)] focus-visible:outline-[var(--chip-outline)]";

  const cls = `${base} ${variant === 'black' ? black : tan}`;

  return (
    <a href={href} className={cls} role="link" aria-label={`Shop ${children}`}>
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span className="opacity-80">· {count}</span>
      )}
    </a>
  );
}

export default Chip;


