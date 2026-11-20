import Link from 'next/link';
import type { Achievement } from '@/content/types';

/** The achievements grid: event (bold, linked), award (yellow) and description. */
export function AchievementRows({ achievements }: { achievements: readonly Achievement[] }) {
  return (
    <div className="grid grid-cols-1 gap-y-3 min-[900px]:grid-cols-[22ch_34ch_minmax(0,1fr)] min-[900px]:gap-y-[6px]">
      {achievements.map((a) => {
        const detail =
          a.inlineVenue && a.location ? `${a.description}, ${a.location}` : a.description;
        return (
          <div key={a.id} className="max-[899px]:flex max-[899px]:flex-col min-[900px]:contents">
            <span className="font-bold">
              <Link href={`/leadership/achievements/${a.id}/`} className="link-quiet">
                {a.event}
              </Link>
            </span>
            <span className="text-yellow">{a.award}</span>
            <span className="max-[899px]:text-fg-dim">
              {/[.]$/.test(detail) ? detail : `${detail}.`}
              {a.link ? (
                <>
                  {' '}
                  <a href={a.link}>[devpost]</a>
                </>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
