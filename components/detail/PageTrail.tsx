import Link from 'next/link';
import type { Trail } from '@/lib/detail';

const LINK = 'inline-flex min-h-11 items-center text-fg-dim';

/** `cd ..`, `‹ prev` and `next ›`: the way out of a detail page. */
export function PageTrail({ trail }: { trail: Trail }) {
  return (
    <nav
      aria-label={`${trail.section} pages`}
      className="border-line flex flex-wrap items-center gap-x-6 border-t pt-3"
    >
      {trail.up ? (
        <Link href={trail.up.href} className={LINK}>
          cd ..
        </Link>
      ) : null}
      {trail.prev ? (
        <Link href={trail.prev.href} rel="prev" className={LINK}>
          ‹ prev <span className="sr-only">: {trail.prev.label}</span>
        </Link>
      ) : null}
      {trail.next ? (
        <Link href={trail.next.href} rel="next" className={`${LINK} sm:ml-auto`}>
          next › <span className="sr-only">: {trail.next.label}</span>
        </Link>
      ) : null}
    </nav>
  );
}
