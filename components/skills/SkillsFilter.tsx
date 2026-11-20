'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  filterMessage,
  parseSection,
  SKILL_SECTIONS,
  sectionQuery,
  type SkillSection,
} from '@/lib/skills';

type SkillsFilterProps = { counts: Record<SkillSection, number> };

const subscribe = () => () => {};

/**
 * The filter buttons. The skills boxes stay server-rendered and fully visible; this island only
 * toggles their `hidden` attribute (by `data-section`), so no-JS users see everything.
 */
export function SkillsFilter({ counts }: SkillsFilterProps) {
  // Read the URL without useSearchParams, which would force client-only rendering.
  const fromUrl = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => '',
  );
  const [picked, setPicked] = useState<SkillSection | null>(null);
  const section = picked ?? parseSection(fromUrl);

  useEffect(() => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-section]')) {
      el.hidden = section !== 'all' && el.dataset.section !== section;
    }
  }, [section]);

  const choose = (next: SkillSection) => {
    setPicked(next);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${sectionQuery(next)}${window.location.hash}`,
    );
  };

  return (
    <>
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap items-center gap-2.5"
      >
        <span className="text-fg-dim">--section=</span>
        {SKILL_SECTIONS.map((key) => {
          const active = key === section;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => choose(key)}
              className={`min-h-11 cursor-pointer border px-4 font-[inherit] ${
                active ? 'border-green bg-green text-bg' : 'border-line bg-bg-raised text-fg'
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {filterMessage(section, counts)}
      </p>
    </>
  );
}
