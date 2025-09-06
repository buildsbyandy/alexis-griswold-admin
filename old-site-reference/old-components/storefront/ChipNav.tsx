import React from 'react';
import { Chip } from './Chip';

const CATS = [
  { slug: 'food', label: 'Food', icon: '🍴' },
  { slug: 'healing', label: 'Healing', icon: '🌿' },
  { slug: 'home', label: 'Home', icon: '🏠' },
  { slug: 'personal-care', label: 'Personal Care', icon: '🧴' },
] as const;

export function ChipNav({ active }: { active?: string }) {
  return (
    <div className="md:hidden" role="navigation" aria-label="Shop by category">
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {CATS.map(c => (
            <Chip
              key={c.slug}
              href={`/storefront/${c.slug}`}
              variant="black"
              active={active === c.slug}
              icon={<span aria-hidden>{c.icon}</span>}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChipNav;


