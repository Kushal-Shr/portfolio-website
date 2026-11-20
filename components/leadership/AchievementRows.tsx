import Link from 'next/link';
import type { Achievement } from '@/content/types';

/** The achievements grid: event (bold, linked), award (yellow) and description. */
export function AchievementRows({ achievements }: { achievements: readonly Achievement[] }) {
  return (
    <div className="grid grid-cols-[22ch_34ch_minmax(0,1fr)] gap-y-[6px]">
      {achievements.map((a) => {
        const detail =
          a.inlineVenue && a.location ? `${a.description}, ${a.location}` : a.description;
        return (
          <div key={a.id} className="contents">
            <span className="font-bold">
              <Link href={`/leadership/achievements/${a.id}/`} className="link-quiet">
                {a.event}
              </Link>
            </span>
            <span className="text-yellow">{a.award}</span>
            <span>
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
